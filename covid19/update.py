#!/usr/bin/python

import argparse
import json

parser = argparse.ArgumentParser(description="Convert JHU daily tada to JSON")
parser.add_argument("--csv", required = True, help="CSV with JHU Daily data")
parser.add_argument("--json", required = True, help="Prevously parsed data JSON")
parser.add_argument("--force-date", help="Force date")

args = parser.parse_args()


countries = {}


fjson = open(args.json, "r")
jsonstr = "\n".join(fjson.readlines())
fjson.close()

old_data = json.loads(jsonstr)

last_d = "0000-00-00"
for c in old_data.keys():
  for entry in old_data[c]:
    date = entry["date"]
    if date[-2] == "-":
      date=date[:-1]+"0"+date[-1:]
    if date[-5] == "-":
      date=date[:-4]+"0"+date[-4:]
    if last_d < date:
      last_d = date

new_d = "0000-00-00"

fcsv = open(args.csv,"r")
for line in fcsv.readlines():
  line = unicode(line.strip())
  cols = line.split(",")
  if cols[0] == "FIPS":
    continue
  if len(cols) < 7:
    continue

  if (len(cols[2]) > 0 and len(cols[3]) > 0 and cols[2][0] == "\"" and cols[3][-1] == "\""):
    cols[2] = cols[2][1:] + ","+cols[3][:-1]
    for i in range(0, len(cols)-4):
      cols[i+3] = cols[i+4]

  if (len(cols[3]) > 0 and len(cols[4]) > 0 and cols[3][0] == "\"" and cols[4][-1] == "\""):
    cols[3] = cols[3][1:] + ","+cols[4][:-1]
    for i in range(0, len(cols)-5):
      cols[i+4] = cols[i+5]

  name = cols[3]
  date = cols[4].split(' ')[0]
  if date > new_d:
    new_d = date

  confirmed = int(cols[7])
  deaths = int(cols[8])
  recovered = int(cols[9])

  if name not in countries:
    countries[name] = [{"date": "", "confirmed": 0, "deaths": 0, "recovered": 0}]

  countries[name][0]["confirmed"] += confirmed
  countries[name][0]["deaths"] += deaths
  countries[name][0]["recovered"] += recovered

fcsv.close()

if args.force_date is not None:
  new_d = args.force_date



#print "%s vs %s " % (last_d,new_d)

if new_d > last_d:
  for c in countries.keys():
    countries[c][0]["date"] = new_d.replace("-0","-")
    if c in old_data:
      old_data[c].append(countries[c][0])

res = json.dumps(old_data, sort_keys=True, indent=4)
print res


