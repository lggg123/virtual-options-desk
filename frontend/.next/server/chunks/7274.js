exports.id=7274,exports.ids=[7274],exports.modules={22408:()=>{},42464:(e,t,n)=>{"use strict";n.d(t,{L:()=>d});var i=n(79646),a=n(33873),r=n.n(a);class s{constructor(e={}){this.initialized=!1,this.config={model:"gpt-4",temperature:.1,pythonPath:"python3",...e},this.pythonScriptPath=r().join(process.cwd(),"python","crewai_analysis.py")}async initialize(){try{await this.testPythonEnvironment(),this.initialized=!0,console.log("\uD83E\uDD16 CrewAI Analysis Service initialized with Python backend")}catch(e){throw console.error("❌ Failed to initialize CrewAI service:",e),e}}async testPythonEnvironment(){return new Promise((e,t)=>{let n=(0,i.spawn)(this.config.pythonPath||"python3",[this.pythonScriptPath,'{"test": true}']);n.on("close",n=>{0===n?e():t(Error(`Python environment test failed with code ${n}`))}),n.on("error",e=>{t(Error(`Python environment test failed: ${e.message}`))})})}async analyzeMarketTrend(e,t="1D"){this.initialized||await this.initialize();try{let n={marketData:e.map(e=>({price:e.price,volume:e.volume||1e3,timestamp:e.timestamp})),apiKey:this.config.apiKey,timeHorizon:t},i=await this.callPythonAnalysis(n);return console.log(`📊 Market Analysis Complete: ${i.trend.toUpperCase()} (${Math.round(100*i.confidence)}% confidence)`),i}catch(n){return console.error("❌ Market analysis failed:",n),this.fallbackAnalysis(e,t)}}async callPythonAnalysis(e){return new Promise((t,n)=>{let a="",r="",s=(0,i.spawn)(this.config.pythonPath||"python3",[this.pythonScriptPath,JSON.stringify(e)]);s.stdout.on("data",e=>{a+=e.toString()}),s.stderr.on("data",e=>{r+=e.toString()}),s.on("close",e=>{if(0===e)try{let e=JSON.parse(a);if(e.error)return void n(Error(e.message||"Python analysis returned error"));t(e)}catch(e){n(Error(`Failed to parse Python analysis result: ${e}`))}else n(Error(`Python analysis failed with code ${e}: ${r}`))}),s.on("error",e=>{n(Error(`Python process failed: ${e.message}`))})})}fallbackAnalysis(e,t){let n=e.map(e=>e.price),i=e.map(e=>e.volume||1e3),a=e.map(e=>new Date(e.timestamp).getTime()),r=this.generate3DSplineData(n,i,a),s=this.calculateTrendMetrics(n);return{trend:this.determineTrend(s),confidence:this.calculateConfidence(s,i),splineData:r,reasoning:this.generateReasoningText(s,t),timeHorizon:t,error:!0,message:"Using fallback analysis - Python service unavailable"}}async analyzeOptionsStrategy(){return this.initialized||await this.initialize(),this.analyzeImpliedVolatility(),this.analyzeGreeks(),{strategy:"iron_condor",reasoning:"Low volatility environment suggests range-bound movement",confidence:.75,expectedReturn:.08,riskLevel:"medium"}}generate3DSplineData(e,t,n){return{x:n.map((e,t)=>t),y:e,z:t}}calculateTrendMetrics(e){if(e.length<2)return{momentum:0,volatility:0,direction:0,strength:0};let t=e[0],n=e[e.length-1],i=[];for(let t=1;t<e.length;t++)i.push((e[t]-e[t-1])/e[t-1]);let a=i.reduce((e,t)=>e+t,0)/i.length,r=Math.sqrt(i.reduce((e,t)=>e+Math.pow(t-a,2),0)/i.length),s=i.filter(e=>e>0).length/i.length-.5,o=2*Math.abs(s);return{momentum:(n-t)/t,volatility:r,direction:s,strength:o}}determineTrend(e){let{momentum:t,direction:n,strength:i}=e;return i>.6?n>0?"bullish":"bearish":.02>Math.abs(t)?"sideways":t>0?"bullish":"bearish"}calculateConfidence(e,t){let{volatility:n,strength:i}=e,a=Math.max(0,1-10*n),r=t.reduce((e,t)=>e+t,0)/t.length;return .4*a+.4*i+.2*Math.max(0,1-Math.sqrt(t.reduce((e,t)=>e+Math.pow(t-r,2),0)/t.length)/r)}generateReasoningText(e,t){let{momentum:n,volatility:i,direction:a,strength:r}=e,s=`Analysis over ${t} timeframe shows `;return r>.6?s+=a>0?"strong bullish momentum":"strong bearish pressure":.02>Math.abs(n)?s+="sideways consolidation with limited directional bias":s+=n>0?"mild bullish tendency":"mild bearish tendency",i>.03?s+=" with elevated volatility suggesting uncertainty":s+=" with low volatility indicating stable conditions",s+"."}analyzeImpliedVolatility(){return{average:.25,skew:.02,term_structure:[.2,.22,.25,.27]}}analyzeGreeks(){return{total_delta:0,total_gamma:0,total_theta:0,total_vega:0}}}let o=null;var l=n(25311);class c{constructor(e){this.cronJob=null,this.isRunning=!1,this.apiKey=e}async generateDailyBlog(){console.log("\uD83E\uDD16 Blog Agent: Generating daily market blog...");try{var e;let t=(e={apiKey:this.apiKey},o||(o=new s(e)),o),n=this.generateMockMarketData(),i=await t.analyzeMarketTrend(n),a=this.createBlogFromAnalysis(i);return console.log(`✅ Generated blog: "${a.title}"`),a}catch(e){throw console.error("❌ Blog generation failed:",e),e}}async generateCustomBlog(e){console.log(`🤖 Blog Agent: Generating custom blog about "${e}"...`);try{let t=this.createCustomBlog(e);return console.log(`✅ Generated custom blog: "${t.title}"`),t}catch(e){throw console.error("❌ Custom blog generation failed:",e),e}}startDailySchedule(e="0 9 * * 1-5"){if(this.isRunning)return void console.log("\uD83D\uDCC5 Daily blog schedule already running");this.cronJob=new l.yK(e,async()=>{try{let e=await this.generateDailyBlog();this.publishBlog(e)}catch(e){console.error("❌ Scheduled blog generation failed:",e)}},null,!1,"America/New_York"),this.cronJob.start(),this.isRunning=!0,console.log(`🚀 Daily blog schedule started: ${e}`),console.log(`📊 Next blog: ${this.cronJob.nextDate()?.toLocaleString()}`)}stopDailySchedule(){this.cronJob&&(this.cronJob.stop(),this.cronJob=null),this.isRunning=!1,console.log("⏹️  Daily blog schedule stopped")}createBlogFromAnalysis(e){let t=`Market Pulse ${new Date().toLocaleDateString()}: ${e.trend.charAt(0).toUpperCase()+e.trend.slice(1)} Momentum Ahead`,n=`# ${t}

## Executive Summary

${e.reasoning} Our analysis shows a **${e.trend.toUpperCase()}** trend with ${Math.round(100*e.confidence)}% confidence level.

## Technical Analysis

${e.metrics?`
### Current Market Metrics
- **Current Price**: $${e.metrics.current_price.toFixed(2)}
- **Price Change**: ${e.metrics.price_change_pct.toFixed(2)}% (${e.metrics.price_change>0?"\uD83D\uDCC8":"\uD83D\uDCC9"})
- **Momentum**: ${(100*e.metrics.momentum).toFixed(2)}%
- **Volatility**: ${(100*e.metrics.volatility).toFixed(2)}%

`:""}${e.support_resistance?`
### Key Levels to Watch
- **Support Level**: $${e.support_resistance.support.toFixed(2)}
- **Resistance Level**: $${e.support_resistance.resistance.toFixed(2)}
- **Pivot Point**: $${e.support_resistance.pivot.toFixed(2)}

`:""}## Trading Strategy

Based on the ${e.trend} trend analysis:

${this.generateTradingStrategy(e)}

## Market Outlook

The ${e.trend} sentiment suggests ${this.generateOutlook(e)}

## Key Takeaways

${this.generateTakeaways(e)}

---
*This analysis is for educational purposes only and does not constitute financial advice. Always do your own research and consult with a financial advisor.*`;return{id:this.generateId(),title:t,content:n,summary:`Market analysis showing ${e.trend} trend with ${Math.round(100*e.confidence)}% confidence. ${e.reasoning.substring(0,100)}...`,tags:["market-analysis","trading",e.trend,"options","daily-analysis"],publishedAt:new Date,marketData:e,readingTime:Math.ceil(n.split(" ").length/200),slug:this.generateSlug(t),status:"published"}}createCustomBlog(e){let t=`Deep Dive: ${e.charAt(0).toUpperCase()+e.slice(1)}`,n=`# ${t}

## Introduction

Welcome to our comprehensive analysis of ${e}. In today's complex financial markets, understanding ${e} is crucial for making informed investment decisions.

## Market Context

The current market environment presents unique opportunities and challenges related to ${e}. Let's explore the key factors driving this space.

## Strategic Considerations

When approaching ${e}, consider these essential elements:

1. **Risk Assessment**: Evaluate potential downside scenarios
2. **Opportunity Analysis**: Identify key value drivers
3. **Timing Considerations**: Market cycle positioning
4. **Portfolio Impact**: How this fits your overall strategy

## Implementation Approach

For retail and institutional investors looking to engage with ${e}:

### Phase 1: Research & Analysis
- Conduct thorough fundamental analysis
- Review technical indicators
- Assess market sentiment

### Phase 2: Strategy Development
- Define entry and exit criteria
- Set position sizing parameters
- Establish risk management protocols

### Phase 3: Execution & Monitoring
- Execute trades with proper timing
- Monitor performance metrics
- Adjust strategy as needed

## Key Takeaways

- ${e} requires careful analysis and strategic thinking
- Risk management should always be the top priority
- Stay informed about market developments
- Consider professional guidance for complex strategies

---
*Educational content - not financial advice. Always consult with qualified professionals.*`;return{id:this.generateId(),title:t,content:n,summary:`Comprehensive analysis of ${e} including strategic considerations, implementation approaches, and key insights for informed decision-making.`,tags:["analysis",e.replace(/\s+/g,"-").toLowerCase(),"strategy","education"],publishedAt:new Date,readingTime:Math.ceil(n.split(" ").length/200),slug:this.generateSlug(t),status:"published"}}generateTradingStrategy(e){switch(e.trend){case"bullish":return`
- **Long Positions**: Consider call options or long stock positions
- **Defensive Strategies**: Protective puts for downside protection
- **Volatility Plays**: If volatility is low, consider straddles for breakout moves
- **Risk Management**: Set stop-losses at key support levels`;case"bearish":return`
- **Short Strategies**: Put options or covered calls on existing positions
- **Hedging**: Protect long portfolios with puts or collar strategies
- **Cash Management**: Consider reducing exposure or raising cash levels
- **Risk Management**: Avoid catching falling knives, wait for confirmation`;case"sideways":return`
- **Range Trading**: Buy at support, sell at resistance
- **Options Income**: Iron condors, strangles for premium collection
- **Patience**: Wait for clearer directional signals
- **Risk Management**: Keep position sizes smaller in uncertain markets`;default:return`
- **Cautious Approach**: Wait for clearer market signals
- **Risk Management**: Focus on capital preservation
- **Diversification**: Maintain balanced portfolio exposure`}}generateOutlook(e){let t=Math.round(100*e.confidence);return t>75?"strong conviction in the current directional move. Monitor for continuation patterns.":t>50?"moderate confidence levels. Stay alert for potential reversals or consolidation.":"uncertainty in market direction. Focus on risk management and await clearer signals."}generateTakeaways(e){return`
1. **Market Trend**: ${e.trend.toUpperCase()} with ${Math.round(100*e.confidence)}% confidence
2. **Strategy Focus**: ${"bullish"===e.trend?"Long bias with protective measures":"bearish"===e.trend?"Defensive positioning and hedging":"Range-bound strategies and patience"}
3. **Risk Management**: Always prioritize capital preservation
4. **Opportunity**: ${"sideways"!==e.trend?"Directional momentum plays":"Premium collection strategies"}
5. **Monitoring**: Watch key support/resistance levels for confirmation`}generateMockMarketData(){let e=new Date,t=150+50*Math.random(),n=[];for(let i=0;i<10;i++){let a=(Math.random()-.5)*4;n.push({price:t+a,volume:1e3+2e3*Math.random(),timestamp:new Date(e.getTime()-(9-i)*9e5).toISOString()})}return n}async publishBlog(e){console.log(`📢 Publishing blog: "${e.title}"`),console.log(`📝 Summary: ${e.summary}`),console.log(`🏷️  Tags: ${e.tags.join(", ")}`),console.log(`⏱️  Reading time: ${e.readingTime} minutes`)}generateId(){return Date.now().toString(36)+Math.random().toString(36).substr(2)}generateSlug(e){return e.toLowerCase().replace(/[^\w\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").trim()}getStatus(){return{isRunning:this.isRunning,nextRun:this.cronJob?.nextDate()?.toLocaleString()||null,hasApiKey:!!this.apiKey}}}let g=null;function d(e){return g||(g=new c(e)),g}},58856:()=>{}};