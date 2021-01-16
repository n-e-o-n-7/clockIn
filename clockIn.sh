cd /root/clockIn
day=$(date +%F)
node index.js > log/$day.log 2>&1
git add log/$day.log
git commit -m $day
git push origin master
