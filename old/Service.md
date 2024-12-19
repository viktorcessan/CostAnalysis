# <a name="_o602ghmjj5h5"></a>Target audience (with stereotypical quotes):
- **Engineering Directors** (“I’m trying to figure out the best way of organizing and evolving the product/tech/service portfolio based on many different variables”)
- **Engineering Directors** (“My organization doesn’t understand the business case for why we need to move towards automating as much as possible, they don’t get the finances behind it”
- **Engineering Managers** (“I’m trying to make a case for the management team that we should make a platform instead of offering a service. But I can’t get any headcount, but I am not sure how to show them that this is a much better long term investment to move towards a platform”)
- **Engineering Managers** (“I’m expected to do both service delivery and platform automation, but it is different skillsets, and also, we always have to focus on service delivery at the expense of platform automation which slows down the efficiency gains. I need a way to show them the cost implication of not expanding the team temporarily. But I also need to show them the ROI projections of overspending temporarily”)
- **Engineering Managers** (“I need to know what budget I would have in total to build a platform that would remove all the manual work we are doing”)
- **Engineering Managers** (“My outsources everything she can to low cost countries rather than automating. She doesn’t understand the long term implications of outsourcing -- knowledge loss which leads to longer resolution times, more communication, and a hidden burden for the employees still at the company. By the time they understand, all knowledge has been lost and it’s no longer possible to automate and build a platform. Nor is it in the interest of the outsourcing vendor”)

# <a name="_nif30o4gspyd"></a>Goals
1. **Elevate Engineering Directors' Thinking**: Shift their mindset from manual services to platform automation.
1. **Make the Case for Platform Automation vs Outsourcing**: Highlight long-term cost predictability, competence retention, and scalability advantages.
1. **Increase Confidence and Predictability**: Demonstrate how automation reduces variability and enhances decision-making.
1. **Help Engineering Managers Understand Automation's Importance**: Use practical, data-driven insights to illustrate benefits.
1. **Support Business Cases for Team Topologies**: Show how chained platform teams increase scalability and efficiency.

# <a name="_5lbawd5f05pc"></a><a name="_tk1f776viyf3"></a>Definitions:
**Service** 

A service provides direct assistance or completes tasks for customers or internal teams, often in a reactive or on-demand manner. It involves ongoing delivery of specific outcomes rather than creating reusable, self-service systems. The value exchange requires manual efforts. Humans need to customize specific aspects for the user regardless of whether the request is similar month over month.

**Product**

A product is a scalable, reusable system designed to solve problems for a broad audience. It enables users to achieve outcomes independently through self-service and automation, minimizing manual intervention. The value exchange is automated. Different users get the same value without manual interventions or human customizations.

**Platform**

A platform is a curated set of **self-service capabilities** that empowers teams to deliver value independently and efficiently. It abstracts complexity and provides reusable tools, systems, and services, enabling autonomy and accelerating delivery across an organization.

### <a name="_6ax5qfqos5qh"></a>**Four Types of Value**
Value comes in four forms. Different teams impact value in four ways. Some service teams are entirely oriented around one, where as most impact at least two. 

1. **Generate Revenue**
   1. Initiatives that create new revenue streams or increase existing ones by attracting new customers or increasing transactions with current customers.
   1. Example: Launching a new feature that customers are willing to pay for, or expanding into new markets.
1. **Protect Revenue**
   1. Initiatives that preserve existing revenue streams, preventing loss of income from customer churn or competitive threats.
   1. Example: Improving the user experience to reduce customer churn or enhancing security features to protect against risks that could cause financial damage.
1. **Reduce Costs**
   1. Initiatives that focus on making processes more efficient, thereby reducing operational expenses.
   1. Example: Automating manual tasks to reduce labor costs or optimizing infrastructure to reduce IT spending.
1. **Avoid Costs**
   1. Initiatives that prevent future expenses, penalties, or risks. These initiatives may not immediately generate or protect revenue but have a long-term financial impact.
   1. Example: Implementing regulatory compliance features to avoid legal penalties or upgrading systems to prevent potential security breaches.

Each bucket represents a different type of value that an product creates. 

[*Four value buckets](https://blackswanfarming.com/value-a-framework-for-thinking/)*: Generate Revenue, Protect Revenue, Reduce Costs, Avoid Costs*

# <a name="_9j8xzu7g5pdd"></a>Key Metrics
1. **Cost Metrics**
   1. Service delivery costs (manual vs automated)
   1. Platform build and maintenance costs
   1. Cost savings and break-even point
1. **Efficiency Metrics**
   1. Service request processing time (manual vs automated)
   1. Time saved per month
   1. Productivity increase (%)
1. **Revenue Metrics**
   1. Revenue protected (e.g., reduced downtime/errors)
   1. Revenue generated from faster execution
   1. Opportunity cost avoided
1. **Scalability Metrics**
   1. Throughput capacity (manual vs automated)
   1. Growth impact (%)
1. **Risk Metrics**
   1. Error rate reduction (%)
   1. Downtime reduction (hours)

# <a name="_1cw0r1cccaq2"></a>Formulas for Key Metrics
#### <a name="_f6dx6yuwqux9"></a>**Cost Metrics**
- **Service Delivery Cost (Manual)**: 
  - Cost=Team Size×Hourly Rate×Monthly Hours×Service Delivery %
- **Cost Savings**:
  - Savings=Manual Cost−Automated Cost
- **Break-Even Point**: 
- Months to Break Even = Platform Build Cost / Monthly Cost Savings

**Efficiency Metrics**

- **Time Saved per Month**: 
  - Saved Time=Processing Time (Manual)−Processing Time (Automated)
- **Productivity Increase**: 
  - Productivity % = (Time Saved / Manual Time) x 100
#### <a name="_onpvd8p8dkmx"></a>**Revenue Metrics**
- **Revenue Protected**: 
  - Revenue=Revenue Impact per Day×Downtime Reduced (Days)
- **Revenue Generated by Faster Execution**: 
  - Revenue=Time Saved (Months)×Revenue per Month
#### <a name="_7gjrqwu78uj1"></a>**Scalability Metrics**
- **Throughput Capacity (Manual)**: 
  - Team Capacity (Hours) / Time per Request
- **Growth Impact**: 
  - Growth % = ((Automated Throughput – Manual Throughput) /Manual Throughput) x 100

-----
### <a name="_f9jn3hucrn1i"></a>**Platform Automation vs Outsourcing**
1. **Core Arguments**
   1. **Cost Comparison**: Outsourcing saves immediate costs but becomes unsustainable long-term due to linear scaling costs.
   1. **Competence Retention**: Platforms maintain institutional knowledge, while outsourcing results in knowledge drain.
   1. **Scalability**: Automation adapts to growth; outsourcing is constrained by labor capacity.
   1. **Misaligned Incentives**: Vendors profit from manual services and lack motivation to automate.
1. **Metrics for Comparison**
   1. Cost over time (manual, outsourced, automated)
   1. Competence loss costs (e.g., cost of rebuilding in-house teams)
   1. Unit cost comparison under scaling scenarios
# <a name="_k9t8k2vnweou"></a>UI
I’ve been thinking about a **goal-driven UI** that dynamically tailors inputs (like sliders) based on the user’s selected statements or attributes. This approach makes the tool **more intuitive and personalized**, helping users focus only on relevant metrics and variables.

Select all that are true for you:

- My company focuses on reducing and avoiding costs associated with service delivery.
- "My company focuses on generating new revenue and protecting existing revenue streams."
- "My team increases employee productivity by reducing time spent on manual or repetitive tasks."
- "My team handles a lot of repetitive work that could be automated."
- "My team struggles to scale operations as the company grows without adding more resources."
- "My company values empowering teams to work autonomously without relying on support services."

One additional note, the outsourcing should probably have some other sliders. For example, an org doing outsourcing looks at the net positive effect per hour. So we'd need to collect information about the teams current cost and allocation. And we should also have a slider for assumed increased resolution time. Outsourcing to save costs often looks cheaper but is often much more expensive.

Thought a very good idea is often to outsource temporarily to low cost vendors, while you maintain the current employees and use them to automate (if they have the skillset), and over time you offset the cost increase by terminating the outsourcing vendor. Alternatively, you take on the next area that needs to be automated and improved.
