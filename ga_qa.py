from apiclient.discovery import build
import httplib2
from oauth2client import client
from oauth2client import file
from oauth2client import tools
import argparse

#google sheets
import gspread

def get_views_ids():
  try:
    gc = gspread.service_account(filename="./gs_credentials.json")
    sh = gc.open('Sidearm QA test sheet')
    views_list = sh.values_get("Sheet1!E4:E")['values']
    clean_views_list = []
    for view in views_list:
      clean_views_list.append(view[0])
    return clean_views_list
  except:
    print('there was an error intiliazing the spreadsheet communication')

def write_view_data(views_data):
  try:
    gc = gspread.service_account(filename="./gs_credentials.json")
    sh = gc.open('Sidearm QA test sheet').sheet1
    sh.update('J4', views_data)
  except:
    print('there was an error writing in the spreadsheet')


# GS_SCOPE = ['https://www.googleapis.com/auth/spreadsheets	']
# GS_CREDS = ServiceAccountCredentials.from_json_keyfile_name('gs_credentials.json',scopes=GS_SCOPE)
# CLIENT = gspread.authorize(GS_CREDS)

# sheet = CLIENT.open('Sidearm QA test sheet').sheet1

# data = sheet.get_all_records()

# print(data)

SCOPES = ['https://www.googleapis.com/auth/analytics.readonly']
CLIENT_SECRETS_PATH = 'ga_secret.json' # Path to client_secrets.json file.

def initialize_analyticsreporting():
    """Initializes the analyticsreporting service object.
    Returns:
    analytics an authorized analyticsreporting service object.
    """
  # Parse command-line arguments.
    parser = argparse.ArgumentParser(formatter_class=argparse.RawDescriptionHelpFormatter,parents=[tools.argparser])
    flags = parser.parse_args([])
  # Set up a Flow object to be used if we need to authenticate.
    flow = client.flow_from_clientsecrets(
      CLIENT_SECRETS_PATH, scope=SCOPES,
      message=tools.message_if_missing(CLIENT_SECRETS_PATH))
  # Prepare credentials, and authorize HTTP object with them.
  # If the credentials don't exist or are invalid run through the native client
  # flow. The Storage object will ensure that if successful the good
  # credentials will get written back to a file.
    storage = file.Storage('analyticsreporting.dat')
    credentials = storage.get()
    if credentials is None or credentials.invalid:
        credentials = tools.run_flow(flow, storage, flags)
    http = credentials.authorize(http=httplib2.Http())
  # Build the service object.
    analytics = build('analyticsreporting', 'v4', http=http)
    return analytics

def get_report(analytics):
  view_id_list = get_views_ids()
  # view_id_list = ['240454258']
  views_report = []
  start_date = '2021-04-20'
  end_date = '2021-04-24'
  for view in view_id_list:
    try:
      body ={
        'reportRequests': [
          {
            'viewId': view,
            'dateRanges': [{'startDate': start_date, 'endDate': end_date}],
            'metrics': [
              {'expression': 'ga:sessions'}
              # {'expression': 'ga:pageviews'}
              ],
          }]
      }

      report = analytics.reports().batchGet(body=body).execute()
      # print(report)
      views_report.append(print_response(report, view))
    except:
      print('cannot authenticate to this view')
      views_report.append(['view_id', view, 'sessions', 'ERROR'])
  print('views report')
  print(views_report)
  write_view_data(views_report)

def print_response(response, view_id):
  """Parses and prints the Analytics Reporting API V4 response.

  Args:
    response: An Analytics Reporting API V4 response.
  """
  view_sessions_data = ['view_id', view_id, 'sessions', '0']
  for report in response.get('reports', []):
    columnHeader = report.get('columnHeader', {})
    dimensionHeaders = columnHeader.get('dimensions', [])
    metricHeaders = columnHeader.get('metricHeader', {}).get('metricHeaderEntries', [])
    for row in report.get('data', {}).get('rows', []):
      dimensions = row.get('dimensions', [])
      dateRangeValues = row.get('metrics', [])
      for header, dimension in zip(dimensionHeaders, dimensions):
        print(header + ': ', dimension)

      for i, values in enumerate(dateRangeValues):
        print('Date range:', str(i))
        for metricHeader, value in zip(metricHeaders, values.get('values', '0')):
          if metricHeader.get('name') == 'ga:sessions':
            view_sessions_data[3] = value
          # print(metricHeader.get('name') + ':', value)
  return(view_sessions_data)


def main():
	analytics = initialize_analyticsreporting()
	get_report(analytics)

if __name__ == '__main__':
	main()