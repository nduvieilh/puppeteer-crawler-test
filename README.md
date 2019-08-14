# puppeteer-crawler-test
Proof of concept for a distributed puppeteer crawling service. 

# What does it do?
Given a list of state names it will navigate to the corresponding wikipedia.com page, take a screenshot, and save it in the screenshots folder. It utilizes a homegrown load balancer concept and Google's puppeteer library to allow multiple simultaneous asynchronous requests to be processed at the same time.
