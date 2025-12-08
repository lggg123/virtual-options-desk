"""
Tests for ML Service API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# Mock the ml_ensemble module before importing the app
@pytest.fixture(autouse=True)
def mock_ml_ensemble():
    """Mock the ML ensemble to avoid loading actual models"""
    mock_ensemble_class = MagicMock()
    mock_ensemble_instance = MagicMock()
    mock_ensemble_instance.is_trained = False
    mock_ensemble_instance.feature_importance = {}
    mock_ensemble_instance.feature_engineer = MagicMock()
    mock_ensemble_instance.feature_engineer.feature_names = []
    mock_ensemble_instance.models = []
    mock_ensemble_class.return_value = mock_ensemble_instance

    with patch.dict('sys.modules', {
        'ml_ensemble': MagicMock(
            StockScreeningEnsemble=mock_ensemble_class,
            MonthlyScreeningPipeline=MagicMock(),
            ModelPrediction=MagicMock()
        ),
        'python.ml_ensemble': MagicMock(
            StockScreeningEnsemble=mock_ensemble_class,
            MonthlyScreeningPipeline=MagicMock(),
            ModelPrediction=MagicMock()
        )
    }):
        yield mock_ensemble_instance


@pytest.fixture
def client(mock_ml_ensemble):
    """Create test client"""
    from ml_api import app
    return TestClient(app)


class TestHealthEndpoints:
    """Test health check endpoints"""

    def test_root_endpoint(self, client):
        """Test root endpoint returns service info"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()

        assert data["service"] == "Stock Screening ML API"
        assert data["status"] == "online"
        assert data["version"] == "1.0.0"
        assert "models_trained" in data

    def test_health_endpoint(self, client):
        """Test health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "healthy"


class TestTrainingEndpoints:
    """Test model training endpoints"""

    def test_get_training_status(self, client):
        """Test getting training status"""
        response = client.get("/api/ml/status")
        assert response.status_code == 200
        data = response.json()

        assert "is_training" in data
        assert "is_trained" in data
        assert "progress" in data
        assert "message" in data

    def test_train_models_already_training(self, client, mock_ml_ensemble):
        """Test training endpoint when already training"""
        # Mock training in progress
        with patch('ml_api.training_status', {
            "is_training": True,
            "progress": 50,
            "message": "Training...",
            "started_at": "2025-01-01T00:00:00",
            "completed_at": None
        }):
            response = client.post("/api/ml/train", json={
                "forward_days": 30,
                "cv_splits": 5,
                "force_retrain": False
            })
            assert response.status_code == 400
            assert "already in progress" in response.json()["detail"]


class TestPredictionEndpoints:
    """Test prediction endpoints"""

    def test_predict_without_trained_models(self, client, mock_ml_ensemble):
        """Test prediction when models not trained"""
        mock_ml_ensemble.is_trained = False
        mock_ml_ensemble.load_models.side_effect = FileNotFoundError("No models found")

        response = client.post("/api/ml/predict", json={
            "symbols": ["AAPL", "MSFT"],
            "top_n": 10
        })
        assert response.status_code == 400
        assert "not trained" in response.json()["detail"]

    def test_screen_without_trained_models(self, client, mock_ml_ensemble):
        """Test screening when models not trained"""
        mock_ml_ensemble.is_trained = False
        mock_ml_ensemble.load_models.side_effect = FileNotFoundError("No models found")

        response = client.post("/api/ml/screen", json={
            "universe": ["AAPL", "MSFT", "GOOGL"],
            "top_n": 100
        })
        assert response.status_code == 400


class TestFeatureImportanceEndpoint:
    """Test feature importance endpoint"""

    def test_feature_importance_without_training(self, client, mock_ml_ensemble):
        """Test feature importance when models not trained"""
        mock_ml_ensemble.is_trained = False

        response = client.get("/api/ml/feature-importance")
        assert response.status_code == 400
        assert "not trained" in response.json()["detail"]


class TestDeleteModelsEndpoint:
    """Test model deletion endpoint"""

    def test_delete_nonexistent_models(self, client, mock_ml_ensemble):
        """Test deleting models when none exist"""
        with patch('os.path.exists', return_value=False):
            response = client.delete("/api/ml/models")
            assert response.status_code == 200
            data = response.json()
            assert "No models found" in data["message"]


class TestRequestModels:
    """Test Pydantic request/response models"""

    def test_training_request_defaults(self):
        """Test TrainingRequest default values"""
        from ml_api import TrainingRequest

        request = TrainingRequest()
        assert request.forward_days == 30
        assert request.cv_splits == 5
        assert request.force_retrain == False

    def test_prediction_request(self):
        """Test PredictionRequest model"""
        from ml_api import PredictionRequest

        request = PredictionRequest(symbols=["AAPL", "MSFT"])
        assert request.symbols == ["AAPL", "MSFT"]
        assert request.top_n == 100

    def test_screening_request(self):
        """Test ScreeningRequest model"""
        from ml_api import ScreeningRequest

        request = ScreeningRequest(universe=["AAPL", "MSFT"], top_n=50)
        assert request.universe == ["AAPL", "MSFT"]
        assert request.top_n == 50


class TestTrainingStatusResponse:
    """Test training status response structure"""

    def test_training_status_response_model(self):
        """Test TrainingStatusResponse model"""
        from ml_api import TrainingStatusResponse

        response = TrainingStatusResponse(
            is_training=False,
            is_trained=True,
            progress=100,
            message="Training completed",
            started_at="2025-01-01T00:00:00",
            completed_at="2025-01-01T01:00:00"
        )

        assert response.is_training == False
        assert response.is_trained == True
        assert response.progress == 100


class TestAPIVersioning:
    """Test API versioning and metadata"""

    def test_api_title(self, client):
        """Test API has correct title"""
        response = client.get("/")
        data = response.json()
        assert "Stock Screening ML API" in data["service"]

    def test_api_version(self, client):
        """Test API has version info"""
        response = client.get("/")
        data = response.json()
        assert data["version"] == "1.0.0"
