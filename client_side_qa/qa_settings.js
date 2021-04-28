const {google} = require('googleapis')
const creds = require('../credentials/gs_credentials.json');

const run_check = require('./check_pages')

  const client = new google.auth.JWT(
    creds.client_email,
    null,
    creds.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  const read_options = {
    spreadsheetId: '1B_9d48m5kANDPxbcauFPJOZ_VUDhPT7oBv0IZVuoFRY',
    range: 'L2:L100'
  };

  let client_auth;
    client.authorize(function (err, tokens) {
      if (err) {
        console.log(err);
        return;
      } else {
        console.log('connected')
        client_auth = client;
        gsread(client_auth)
      }
  });


  async function gsread(cli) {
    const gsapi = google.sheets({
      version: 'v4',
      auth: cli
    })

    let data = await gsapi.spreadsheets.values.get(read_options);

    let url_list = data.data.values;
    let array_list = []
    url_list.forEach((url) => {
      array_list.push(url[0])
    })
    run_check.check_pages(array_list, client)
  }

  async function gswrite(pages_data){
    const gsapi = google.sheets({
      version: 'v4',
      auth: client_auth
    })
    const write_options = {
      spreadsheetId: '1B_9d48m5kANDPxbcauFPJOZ_VUDhPT7oBv0IZVuoFRY',
      range: 'Master Sheet!R2',
      resource :{values: pages_data}
    };

    let write_spreadsheet = gsapi.spreadsheets.values.update(write_options)
     console.log(write_spreadsheet)
  }


  module.exports.gswrite = gswrite