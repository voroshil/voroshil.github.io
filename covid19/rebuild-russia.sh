#!/bin/bash

add_day(){

#  echo ./update.py --format json --csv $3 --json $1  $2
#  echo
  ./update.py --format json --csv $3 --json $1 > $2
  mv $2 $1
}

create_js(){
  echo -n "var data =" > $1
  cat $2 >> $1
  echo ";" >> $1

}

tmp1=`mktemp`
tmp2=`mktemp`

cat timeseries-russia.json > $tmp1

list=`ls -1 $1/*.csv`
#echo $list

for csv in $list ; do
  add_day $tmp1 $tmp2 $csv
done

create_js timeseries-russia.js $tmp1

test -f $tmp1 && rm $tmp1
test -f $tmp2 && rm $tmp2
