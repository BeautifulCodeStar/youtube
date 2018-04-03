/Start puppeteer and moment
const puppeteer = require('puppeteer');
const moment = require('moment');
// Upwork
//Array for flattening array of arrays into normal array
function flatten(array) {
  return array.reduce(function(memo, el) {
    var items = Array.isArray(el) ? flatten(el) : [el];
    return memo.concat(items);
  }, []);
}

//Start browser
(async () => {
  const browser = await puppeteer.launch({headless: false})
  const page = await browser.newPage()

  var startTime = moment().format('YYYY-MM-DDTHH:00:01'); //Set time at start of hour
  var endTime = moment().format('YYYY-MM-DDTHH:59:59'); //Set time at start of hour
  var cndPage = 'https://www.carnextdoor.com.au/search?location=9-19+Nickson+St,+Surry+Hills+NSW+2010,+Australia&latitude=-33.8898167&longitude=151.21384750000004&start_time_iso=' + startTime + '&end_time_iso=' + endTime + '&transmission[]=automatic&transmission[]=manual&parking_types[]=0&parking_types[]=1&body_types[]=Ute&body_types[]=Van&page=1'

  await page.goto(cndPage)
  await page.waitFor(1500)

  // execute standard javascript in the context of the page.
  var totalArray = [];
  var carLinksArray = [];
  var carNamesArray = [];
  var carRatesArray = [];
  var carTypeArray = [];
  var carTripsArray = [];

  //Start loop which does one page at a time and increments
  for (var i = 0; i < 11; i++){

    //Grab an array of 12 elements for each field on the page
    var carNames = await page.evaluate(() => {
      var anchors = Array.from(document.querySelectorAll('div.vehicle-name'))
      return anchors.map(anchor => anchor.textContent)
    })

    var carLinks = await page.evaluate(() => {
      var anchors = Array.from(document.querySelectorAll('a.search-result'))
      return anchors.map(anchor => anchor.href)
    })

    var carRates = await page.evaluate(() => {
      var anchors = Array.from(document.querySelectorAll('div.fa-dollar + div.text'))
      return anchors.map(anchor => anchor.innerText)
    })

    var carType = await page.evaluate(() => {
      var anchors = Array.from(document.querySelectorAll('div.spaced:not(.view-on-map) > div.text'))
      return anchors.map(anchor => anchor.innerText)
    })

    var carTrips = await page.evaluate(() => {
      var anchors = Array.from(document.querySelectorAll('div.review:nth-child(3) > div.spaced:not(.up):not(.down):not(.muted)'))  //Removes upvotes, downvotes and no votes
      return anchors.map(anchor => anchor.innerText)
    })

    //Save page list to arrays
    carLinksArray.push(carLinks);
    carNamesArray.push(carNames);
    carRatesArray.push(carRates);
    carTypeArray.push(carType);
    carTripsArray.push(carTrips);

    //Paginate before looping to next page
    await page.click('li.next > a.page-link')
  }

  //Individual arrays are in arrays of arrays. Flatten each to a list.
  carLinksArray = flatten(carLinksArray);
  carNamesArray = flatten(carNamesArray);
  carRatesArray = flatten(carRatesArray);
  carTypeArray = flatten(carTypeArray);
  carTripsArray = flatten(carTripsArray);

  totalArray = [carLinksArray, carNamesArray, carRatesArray, carTypeArray, carTripsArray]

  stringify(totalArray, { header: true}, (err, output) => {
		if (err) throw err;
		console.log(output);
		fs.writeFile('my.csv', totalArray, (err) => {
			if (err) throw err;
			console.log('my.csv saved.');
		});
	});

  console.log(totalArray);

  //All done
  await browser.close()

})()
