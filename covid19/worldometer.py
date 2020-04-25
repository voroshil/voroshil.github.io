#!/usr/bin/python

import requests
import sys
import re

res = requests.get('https://www.worldometers.info/coronavirus/#countries')
if res.status_code != 200:
  print "Fetch error"
  sys.exit(-1)

text = res.text.replace('\n','')

tables = text.split('<table')
main_table = None

for i in range(0, len(tables)):
  elems = tables[i].split('</table>')
  tables[i] = '<table'+elems[0]+'</table>'
  if tables[i].find("main_table_countries_today") >= 0:
    main_table = tables[i]

if main_table is None:
  print "Table not found"
  sys.exit(-2)

main_table = main_table.split('<tbody>')[1]
main_table = main_table.split('</tbody>')[0]

reTag = re.compile('<\/?[^>]*>')

data = []
rows = main_table.split('<tr')
for i in range(0, len(rows)):
  rows[i] = rows[i].replace('</tr>','')
  rows[i] = rows[i][rows[i].find('>')+1:]
  rows[i] = rows[i].replace('</td>','</td>|')
  rows[i] = reTag.sub('', rows[i])
  rows[i] = rows[i].replace(',','')
  cols = rows[i].split('|')

  if len(cols) >= 6:
    confirmed = 0;
    try:
      confirmed = int(cols[1])
    except ValueError:
      pass
    recovered = 0
    try:
      recovered = int(cols[5])
    except ValueError:
      pass
    deaths = 0
    try:
      deaths = int(cols[3])
    except ValueError:
      pass
    data.append({'country': cols[0], 'confirmed': confirmed, 'recovered': recovered, 'deaths': deaths})

print "var manual_data = {"
for row in data:
    id = row["country"].replace(" ","").replace(",","").replace("'","").replace("`","")
#  if row['country'] == 'Mexico':
    print "\"covid%s\": {\"confirmed\": %d, \"recovered\": %d, \"deaths\": %d}," % (id, row["confirmed"], row["recovered"], row["deaths"])
print "};"
