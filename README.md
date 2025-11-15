# This is the Data Collection & Processing microservice for D3PHCOM. 

D3PHCOM is a full-stack data pipeline that collects tweets via the Twitter API, processes them through an LLM-powered sentiment analyzer (OpenAI API), stores results in MongoDB, and streams real-time visualizations to a Next.js dashboard.

This server collects the data that would be processed and stored in MongoDB. A separate server handles data fetching for end user clients.

