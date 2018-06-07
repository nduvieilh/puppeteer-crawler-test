const puppeteer = require('puppeteer');
const MAX_INSTANCES = 5;

const states = [
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'Florida',
    'Georgia',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    // 'Kentucky',
    // 'Louisiana',
    // 'Maine',
    // 'Maryland',
    // 'Massachusetts',
    // 'Michigan',
    // 'Minnesota',
    // 'Mississippi',
    // 'Missouri',
    // 'Montana',
    // 'Nebraska',
    // 'Nevada',
    // 'New Hampshire',
    // 'New Jersey',
    // 'New Mexico',
    // 'New York',
    // 'North Carolina',
    // 'North Dakota',
    // 'Ohio',
    // 'Oklahoma',
    // 'Oregon',
    // 'Pennsylvania',
    // 'Rhode Island',
    // 'South Carolina',
    // 'South Dakota',
    // 'Tennessee',
    // 'Texas',
    // 'Utah',
    // 'Vermont',
    // 'Virginia',
    // 'Washington',
    // 'West Virginia',
    // 'Wisconsin',
    // 'Wyoming',
];

async function run() {
    const browser = await puppeteer.launch({headless:false});
    let queue = new Map();
    let instances = new Array();

    console.log(browser);

    for(let state of states) {
        queue.set(state, extractInfo);
    }

    for(var i = 0; i < MAX_INSTANCES; i++) {
        instances.push(new Instance(browser));
    }

    await loadBalance(instances, queue).then(function(data) {
        console.log(data);
    }).catch(console.log);

    await browser.close();

    async function extractInfo(topic, page) {
        return new Promise(async (resolve, reject) => {
            try {
                page.then(async page => {
                    let data = new Map();
                    const selector = `table.infobox>tbody>tr`;
                    const searchUrl = `https://www.wikipedia.org/wiki/${topic}`;
                    await page.goto(searchUrl);
                    // await page.screenshot({
                    //     path: `screenshots/${topic}.png`
                    // });

                    await page.$$(selector).then(elementArray => {
                        for(let element of elementArray) {
                            element.$eval('td', node => {
                                return node.innerText
                            }).then(text => {
                                console.log(text);
                            }).catch((e) => {});
                        }
                    }).catch(console.error);

                    resolve(data);
                });
            } catch(e) { reject(e) };
        });
    }

    async function loadBalance(instances, queue) {
        return new Promise(async (resolve, reject) => {
            try {
                let queueEntries = queue.entries();
                let results = new Map();
                let allJobs = new Array();

                for(let instance of instances) {
                    allJobs.push(runJob(instance));
                }

                Promise.all(allJobs).then(function() {
                    resolve(results);  
                });
                
                async function runJob(instance) {
                    return new Promise(async (resolve, reject) => {
                        try {
                            let queueEntry = queueEntries.next().value;
                            if (typeof queueEntry === 'undefined') {
                                resolve(instance.cleanUp());
                            }
                            let job = queueEntry[1];
                            let key = queueEntry[0];

                            instance.run(job, key).then(function (result) {
                                results.set(key, result);

                                runJob(instance).then(function() {
                                    resolve();
                                });
                            });
                        } catch (e) { reject(e) };
                    });
                }
            } catch (e) { reject(e) };
        });
    }
}

class Instance {
    constructor(browser) {
        this.page = browser.newPage();
    }

    run(job, value) {
        return job(value, this.page);
    }

    cleanUp() {
        this.page.then(page => {
            page.close().catch(console.error);
        }).catch(console.error);
    }
}

run();
