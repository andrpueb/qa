const puppeteer = require('puppeteer');
const qasettings = require('./qa_settings')


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
  const browser = await puppeteer.launch({
      headless: true
    });

  let response_data = []

  for (const url of url_list) {
    const clean_url = url.includes('https//') ? url : 'https://' + url;
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
      const all_params = is_datalayer ? dataLayer.find(({event}) => event === 'dataLayerLoaded'): false;
      let school_params = [];
      let property_id, dl_defined, ssClientID;
      if (all_params) {
        property_id = all_params.gaPropertyID;
        dl_defined = is_datalayer;
        ssClientID = all_params.schoolAttributes.ssClientID;
        school_params.push(property_id, dl_defined, ssClientID)
      }else{
        school_params.push('undefined', is_datalayer, 'undefined')
      }
      return school_params;;
    })
    response_data.push(check_parameters)
    console.log(response_data)
    //console.log(results)
    page.close()
  };
  qasettings.gswrite(response_data)
  await browser.close();
};

module.exports.check_pages = check_pages