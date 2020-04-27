#!/usr/bin/python

import requests
import sys
import re
import argparse

parser = argparse.ArgumentParser(description="Convert Worldometers data to JSON")
parser.add_argument("--json", help="Prevously parsed data JSON")
#parser.add_argument("--force-date", help="Force date")
parser.add_argument("--threshold", type=int, default=5000, help="Threshold of confirmed to output")
args = parser.parse_args()

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
world_found = False
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
    if not world_found and cols[-2] == "All":
      world_found = True
      continue
#    else:
#      print cols[-2]

    if world_found:
      cid = cols[0].replace(" ","").replace(",","").replace("'","").replace("`","")
      data.append({'id': cid, 'country': cols[0], 'confirmed': confirmed, 'recovered': recovered, 'deaths': deaths, "changed": True})

if args.json is not None:
  import json
  fjson = open(args.json, "r")
  jsonstr = "\n".join(fjson.readlines())
  fjson.close()

  old_data = json.loads(jsonstr)

  for i in range(0, len(data)):

    c = data[i]["country"]
    c = c.strip()

    if c == "USA":
      c = "US"
    elif c == "UK":
      c = "United Kingdom"
    elif c == "S. Korea":
      c = "Korea, South"
    elif c == "UAE":
      c = "United Arab Emirates"

    if data[i]["confirmed"] < args.threshold:
      data[i]["changed"] = False
    elif c in old_data:
      last = old_data[c][-1]
      if (last["confirmed"] >= data[i]["confirmed"]):
        data[i]["changed"] = False
      else:
        lc = last["confirmed"]
        wc = data[i]["confirmed"]
        lr = last["recovered"]
        wr = data[i]["recovered"]
        ld = last["deaths"]
        wd = data[i]["deaths"]
        if wc > lc:
          sc = "+%d" % (wc-lc)
        elif wc < lc:
          sc = "-%d" % (lc-wc)
        else:
          sc = ""

        if wr > lr:
          sr = "+%d" % (wr-lr)
        elif wr < lr:
          sr = "-%d" % (lr-wr)
        else:
          sr = ""

        if wd > ld:
          sd = "+%d" % (wd-ld)
        elif wd < ld:
          sd = "-%d" % (ld-wd)
        else:
          sd = ""

        sys.stderr.write("%15s: %7d / %6d / %6d => %6s / %6s / %6s\n" %(c, wc, wr, wd, sc, sr, sd))
    else:
      print c
print "var manual_data = {"
for row in data:
  if row['changed'] and row["confirmed"] > args.threshold:
    print "\"covid%s\": {\"confirmed\": %d, \"recovered\": %d, \"deaths\": %d}," % (row["id"], row["confirmed"], row["recovered"], row["deaths"])
print "};"
