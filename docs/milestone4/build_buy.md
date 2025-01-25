# Build Vs Buy

## Build vs Buy Decision Analyzer
I’d like to build an analyzer that allows a user to input parameters about the market, that finally spits out a recommendation for Build vs Buy, with a confidence interval, and a radar diagram scoring the different dimensions asked about.

The Build vs Buy Tool helps engineering managers objectively evaluate whether to build or buy a solution by scoring options across key dimensions: business criticality, time to implement, cost, control, competency, and market fit.

● **Input**: Users provide structured data like solution type (platform/application/component), business role, timelines, costs, control needs, and market alternatives.  
● **Scoring**: A weighted scoring algorithm calculates separate Build and Buy scores, factoring in business priorities, costs, and risks.  
● **Visualization**: A radar chart shows strengths and weaknesses of Build vs Buy across dimensions, while confidence levels indicate how decisive the recommendation is.  
● **Output**: Clear recommendation (Build, Buy, or Tie) with actionable insights and a breakdown of the decision logic.  

This tool streamlines decision-making, providing transparency and data-driven recommendations for technology investment decisions.

*Note: Below are some screenshots from a bolt.new prototype, but while we have pages there, we should ideally just have this as a long scrollable page, with a different design.*

---

## Decision Framework

### 1. What are you considering building vs. buying?
● What is the scope of the solution?  
(Select one:)  
○ Platform (e.g., end-to-end system that integrates multiple components)  
○ Application (e.g., single-purpose software with a user interface)  
○ Component (e.g., specific functionality or service, such as an API or library)  

### 2. How business-critical will this solution be?
● What role does this solution play?  
(Select one:)  
○ Critical path for revenue (directly impacts customers or product revenue)  
○ Business enabling (improves team/company operations or efficiency)  
○ Internal supporting (back-office or operational systems that don’t directly impact customers)  

● By when do you need this solution in production?  
(Select one using a relative timeline slider:)  
○ 0–3 months  
○ 3–6 months  
○ 6–12 months  
○ 12–24 months  

● How long will this solution be used?  
(Select one:)  
○ <1 year  
○ 1–3 years  
○ 3–5 years  
○ 5 years  

### 3. Market Landscape
● How many alternative solutions exist in the market?  
(Select one:)  
○ None  
○ 1–3  
○ 4–10  
○ 10  

● How fast is this landscape evolving?  
(Select one:)  
○ Very fast (new options and standards emerge regularly)  
○ Moderate (occasional updates and new entrants)  
○ Slow (market is mature and stable)  

● How much standardization exists in the market?  
(Select one:)  
○ High (widely adopted standards exist)  
○ Moderate (some standards, but variations remain)  
○ Low (fragmented with little or no standardization)  

● What type of alternatives exist?  
(Select all that apply:)  
○ Open source  
○ Commercial  

### 4. Control and Competency
● How much control do you need over features and functionality if bought?  
(Select one:)  
○ Full control (extensive customization and updates required)  
○ Partial control (minor customization or updates)  
○ No control (standard functionality is sufficient)  

● Do you have the in-house competency to build this solution?  
(Select one:)  
○ Yes, fully  
○ Yes, partially (requires some upskilling)  
○ No  

● If no, how long would it take to acquire the competency?  
(Select one using a relative timeline slider:)  
○ 0–3 months  
○ 3–6 months  
○ 6–12 months  
○ 12–24 months  

### 5. Cost and Resource Requirements
● For building in-house:  
○ How many FTEs will be required?  
(Provide numeric inputs for development and maintenance FTEs.)  
○ What is the average hourly rate of engineers?  
(Provide numeric input, e.g., $X/hour.)  

● For buying:  
○ Cost of acquisition:  
(Provide numeric input, e.g., $X for licenses or purchase.)  
○ Cost of customization and integration:  
(Provide numeric input, e.g., $X.)  
○ Cost of maintenance (annual):  
(Provide numeric input, e.g., $X/year.)  

### 6. Time and Fit for Purpose
● How long will it take to implement this solution?  
(Select one:)  
○ 0–3 months  
○ 3–6 months  
○ 6–12 months  
○ 12–24 months  

● How fit for purpose are the available alternatives?  
(Select one:)  
○ Highly fit (requires minimal adaptation)  
○ Moderately fit (requires some customization)  
○ Poorly fit (requires extensive customization or compromises)  

### 7. Strategic Alignment and Risks
● How central is this solution to your company's strategy?  
(Select one:)  
○ Core to differentiation or competitive advantage  
○ Necessary for operational efficiency, but not differentiating  
○ Nice to have, but not essential  

● What risks are associated with each option?  
(Select all that apply:)  
○ Build: Delivery delays, technical debt, reliance on internal staff  
○ Buy: Vendor lock-in, limited customization, rising long-term costs  

---
## Scoring Methodology

1. **Assign Weighted Categories**  
Each dimension is given a weight based on its importance (total weight = 100%).  
Adjust the weights as per your priorities. Example weights:  
○ Business Criticality: 25%  
○ Time to Implement: 15%  
○ Cost: 20%  
○ Control: 10%  
○ Competency: 10%  
○ Market Landscape (fit, standardization, etc.): 20%  

2. **Scoring for Each Dimension**  
Each category will have predefined criteria to assign scores (1-5 or similar). For example:  

○ **Business Criticality**:  
  ■ Critical path for revenue → 5  
  ■ Business enabling → 3  
  ■ Internal supporting → 1  

○ **Time to Implement**:  
  ■ 0–3 months → 5  
  ■ 3–6 months → 4  
  ■ 6–12 months → 3  
  ■ 12–24 months → 1  

○ **Cost (normalized across build and buy)**:  
  ■ Build < Buy → 5  
  ■ Build ~ Buy → 3  
  ■ Build > Buy → 1  

○ **Control Needed**:  
  ■ Full control → 5  
  ■ Partial control → 3  
  ■ No control → 1  

○ **Competency**:  
  ■ Full competency → 5  
  ■ Partial competency → 3  
  ■ No competency → 1  

○ **Market Fit and Evolution**:  
  ■ High standardization & fit → 5  
  ■ Moderate fit → 3  
  ■ Poor fit → 1  

3. **Total Weighted Scores**  
$$ Total\ Score\ (Build) = \sum (Weight\ of\ Dimension \times Score\ for\ Build) $$  
$$ Total\ Score\ (Buy) = \sum (Weight\ of\ Dimension \times Score\ for\ Buy) $$  

4. **Confidence Interval**  
○ Calculate the variance in scoring for each dimension (based on range/spread of options)  
○ Use this variance to express uncertainty in the recommendation. Example:  
  ■ If dimensions have tight scoring (e.g., 4.5 vs 4.6), confidence in the recommendation is high  
  ■ If scores are close but variance is high, confidence is moderate/low  

5. **Recommendation**  
○ Build if Build Score > Buy Score by a significant margin (e.g., >10%)  
○ Buy if Buy Score > Build Score by the same margin  
○ Tie if scores are very close (e.g., within ±5%)  

