const puppeteer = require('puppeteer');
const qa_settings = require('./qa_settings')


//make it node crash on error
process.on('unhandledRejection', up => {
  throw up
})

const page_url = 'https://fightingillini.com/';

// async function get_urls(){
//  return qa_settings.get_url_list();
// }


//(async () => {
async function check_pages(url_list) {
  //console.log(url_list)
  for (const url of url_list) {
    const clean_url = url.includes('https//') ? url : 'https://' + url;
    const browser = await puppeteer.launch({
      headless: true
    });
    const page = await browser.newPage();

    const client = await page.target().createCDPSession();
    await client.send('Network.enable');

    // added configuration
    await client.send('Network.setRequestInterception', {
      patterns: [{
        urlPattern: '*'
      }],
    });

    await client.on('Network.requestIntercepted', async e => {
      //console.log('EVENT INFO: ');
      //console.log(e.request);
      await client.send('Network.continueInterceptedRequest', {
        interceptionId: e.interceptionId,
      });
    });

    await page.goto(clean_url);
    //await page.waitForSelector('#onetrust-button-group');
    //await page.click('button#onetrust-accept-btn-handler');
    let data = await client.send('Network.getAllCookies')
    //console.log(data)
    //await page.screenshot({path: 'after_OT.png'});

    const check_parameters = await page.evaluate(() => {
      const is_datalayer = window.dataLayer ? true : false;
      console.log('test')
      const all_params = dataLayer.find(({
        event
      }) => event === 'dataLayerLoaded');
      if (all_params) {
        const school_ids = {
          'isdatalayer': is_datalayer,
          'gaPropertyID': all_params.gaPropertyID,
          'ssClientID': all_params.schoolAttributes.ssClientID
        }
        return school_ids
      }
    })
    console.log(check_parameters)
    //console.log(results)
    page.close()
  };
};

module.exports = {
  check_pages
}
//})();