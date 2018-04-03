'use strict';
var async = require('async');
var request = require('request');
var fs = require('fs');
var stringify = require('csv-stringify');


var key = "AIzaSyCSJXrkW8X1h-H0oJ74DApywWNEEAC5LIo";

var nextPageToken = '';
//var channelId = 'UCCcVQKtF8zHVQoTJt8NNMJA';
var channelIds = ["UC2J7masgTZkHUiVowVJi6eg","UCCcVQKtF8zHVQoTJt8NNMJA","UC2AmGRHTJoUhChm_rmJlXfQ","UChDaEjWqLQ_FMWioF4pHqhw","UCL_SZi70jqSrttwm_LL0cuA","UCQBu4FJMzuc6ME8dbrWJV6g","UChAYWoErHbS0CNvEXO3eJKw","UC_jM74fkz2JBaNET0mVwg1Q","UCzIsQCPkuNz2KZ-bhzeEiRg","UCk1UvIAkYJBrD6XXDMZ-HSg","UCE7nXtv4j6OtZ9GV3lmeroQ","UCqp6OhEmlbH1WpPObE9DFbg"];
//var playlistId = 'PL4QjLDoG7TbOhXxdD1LOs4o9X9xhwylN7';
//var urlPlaylist = 'https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=' + channelId + '&maxResults=50&pageToken=' + pageToken + '&key=' + key;
//var urlVideo = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=' + playlistId + '&key=' + key;
var videoJson;
var count = 1;
var gotAllPlaylists = false;
var ArrAllVideos = [];
var ArrAllPlaylists = [];
var totalVideos = 0;
var cyFinalArray = [];
var columns = 
cyFinalArray.push(["Channel Id, Channel Title, Playlist Id, PLaylist Title, Video Id, Video Title"]);


function videoIdRequest(playlistId, nextPageToken) {
	var urlVideo = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&pageToken='+nextPageToken+'&playlistId=' + playlistId + '&key=' + key;
	return new Promise(function(resolve) {
		request.get({
			url: urlVideo,
			json: true,
			headers: {'User-Agent': 'request'}
		}, (err, res, json) => {
			if (err) {
				console.log("error");
			} else if ( res.statusCode !== 200) {
				console.log(res.statusCode);
			} else {
				resolve(json);
			}
		})
	})
	.then(function(json) {
		var nextPageToken = json.nextPageToken;
		totalVideos = totalVideos + json.items.length;
		console.log('videoId nextPageToken:'+ nextPageToken + "  Items: "+json.items.length + "  Total Videos: " + totalVideos);
		for (var i = 0; i<json.items.length; i++) {
			var videoId = json.items[i].snippet.resourceId.videoId;
			var title = json.items[i].snippet.title;
			ArrAllVideos.push({'videoId':videoId, 'title':title});
		}


		if (nextPageToken) {
			videoIdRequest(playlistId, nextPageToken);
		} else {
			return ArrAllVideos;
		}
		
		/*return nextPageToken
            ? videoIdRequest(playlistId, nextPageToken)
            : ArrAllVideos;*/
	})
}

function playlistsRequest(channelId, nextPageToken) {
    var url = 'https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId='+channelId+'&maxResults=50&pageToken=' + nextPageToken + '&key=' + key;

    return new Promise(function (resolve) {
       request.get({
	    	url: url,
	    	json: true,
	    	headers: {'User-Agent': 'request'}
	  	}, (err, res, json) => {
	    	if (err) {
	      		console.log('Error:', err);
	    	} else if (res.statusCode !== 200) {
	      		console.log('Status:', res.statusCode, json.error.erros);	
	      		reject();
	    	} else {
	      		resolve(json);
	    	}
	  	});
    })
    .then(async function (json) {
    	// var channelId = 'UCCcVQKtF8zHVQoTJt8NNMJA';
    	var nextPageToken = json.nextPageToken;
    	console.log('playlistId nextPageToken:', nextPageToken);
		for (var i = 0; i<json.items.length; i++) {
			var channelId = json.items[i].snippet.channelId;
			var channelTitle = json.items[i].snippet.channelTitle;
			var playlistId = json.items[i].id;
			var playlistTitle = json.items[i].snippet.title;
			
			ArrAllPlaylists.push({
				'channelId': channelId,
				'channelTitle': channelTitle,
				'playlistId': playlistId,
				'playlistTitle': playlistTitle,
				'videoDetails':[],
			});
		}

		
        return nextPageToken
            ? playlistsRequest(channelId, json.nextPageToken)
            : true;
    });
}

function insertData(myChannelId, myChannelTitle, myPlaylistId, myPLaylistTitle, myVideoId, myVideoTitle) {
	return new Promise(function(resolve, reject) {
		cyFinalArray.push(["\n"+myChannelId+", "+myChannelTitle+", "+myPlaylistId+", "+myPLaylistTitle+", "+myVideoId+", "+myVideoTitle]);
		resolve();
	})
}

let task = async function asyncCall() {
	
	for (var i=0; i< channelIds.length;i++) {
		var channelId = channelIds[i];
		var nextPageToken = '';
		let firstResult = await playlistsRequest(channelId, nextPageToken);
	}

	for (var i=0; i < ArrAllPlaylists.length; i++) {
		var videoDetails = await videoIdRequest(ArrAllPlaylists[i].playlistId, '');
		ArrAllPlaylists[i].videoDetails = videoDetails;
	}

	console.log("ArrAllPlaylists: "+ArrAllPlaylists.length);
	console.log("Sample: " + ArrAllPlaylists[1].videoDetails[0].title);

	
	for (var i=0; i<ArrAllPlaylists.length; i++) {  //Print out the first 50 results
		var myChannelId = ArrAllPlaylists[i].channelId;
		var myChannelTitle = ArrAllPlaylists[i].channelTitle;
		var myPlaylistId = ArrAllPlaylists[i].playlistId;
		var myPLaylistTitle = ArrAllPlaylists[i].playlistTitle;
		var myVideoId = ArrAllPlaylists[i].videoDetails? ArrAllPlaylists[i].videoDetails[0].videoId : 0;
		var myVideoTitle = ArrAllPlaylists[i].videoDetails? ArrAllPlaylists[i].videoDetails[0].title : 'No data';
		await insertData(myChannelId, myChannelTitle, myPlaylistId, myPLaylistTitle, myVideoId, myVideoTitle);

		console.log("here");
	}
	
	stringify(cyFinalArray, { header: true}, (err, output) => {
		if (err) throw err;
		console.log(output);
		fs.writeFile('my.csv', cyFinalArray, (err) => {
			if (err) throw err;
			console.log('my.csv saved.');
		});
	});

	cyFinalArray = [];
	console.log("Total Videos: " + totalVideos);
}

task();