const {google} = require('googleapis')
const creds = require('./credentials.json');

const run_check = require('./check_pages')


  const client = new google.auth.JWT(
    creds.client_email,
    null,
    creds.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  const options = {
    spreadsheetId: '1n6wZmWrvuGD-Va3dgY7E9mUWF72KbbtT04pMU9oUBR8',
    range: 'A4:A13'
  };

  client.authorize(function (err, tokens) {
      if (err) {
        console.log(err);
        return;
      } else {
        console.log('Connected');
        gsrun(client)
      }
  });


  async function gsrun(cli) {
    const gsapi = google.sheets({
      version: 'v4',
      auth: cli
    })

    let data = await gsapi.spreadsheets.values.get(options);

    let url_list = data.data.values;
    //console.log(url_list)
    let array_list = []
    url_list.forEach((url) => {
      array_list.push(url[0])
    })

    //console.log(array_list)
    run_check.check_pages(array_list)
  }

  // (async() =>{
  //   console.log('before start')
  //   await auth();
  //   console.log('after start')
  // })();

// module.exports = {auth}