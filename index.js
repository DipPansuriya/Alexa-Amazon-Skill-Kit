'use strict';

const Alexa = require('alexa-sdk')
var http = require('http')
const cheerio = require('cheerio')
var request = require('request');
const APP_ID = 'amzn1.ask.skill.2c54b5cf-2a9b-42e7-84ec-96f8ed763eb9'

var alexa_score=0, player_score = 0;




const handlers = 
{
	'LaunchRequest':function(){
		this.attributes.speechOutput = 'Hello, I am Infora, you can ask me any question, for example: What is the answer to the ultimate question of life!';
		this.attributes.repromptSpeech = 'Go ahead! Literally ask me anything!';
		this.emit(':ask',this.attributes.speechOutput, this.attributes.repromptSpeech)
	},
	'Unhandled':function(){
		this.emit(':ask','I did not understand the context, could you please rephrase the question?','please rephrase the question and give me another try');
	}
	,
	'SessionEndedRequest':function(){
		this.emit(':tell','Thank you have a good day!');
	},
	'TextReaderIntent':function(){
	    var glob = this
		const itemSlot = this.event.request.intent.slots.BOOKNAME;
		var response = 'Ok Sir, I am finding '+itemSlot.value;
		this.attributes.speechOutput = response;
		var strO = '';
		var allNews='';
		var hrefList = [];
		var nwsLink = 'https://www.google.com/search?q=%27'+itemSlot.value+'%27';
		console.log(nwsLink);
		var href = '';
		///////////////////////////////////////////////
		////////Mulitple links/////
		var httpgetO = require('https').get(nwsLink, (resO) => {
            resO.setEncoding('utf8');
            resO.on('data', function (bodyO) {
                strO += bodyO
            });
            resO.on('end', function (bodyO) {
                const $ = cheerio.load(strO)
				console.log(strO)
				var container = $('#ires .g')
				console.log("#*#*#*# link container length:"+container.length);
				for(var h=0;h<container.length;h++){
					if($($(container[h]).find("a")).length>0){
						//console.log('!#!#!# '+$($(container[h]).find("a")).length)
						href= $($(container[h]).find("a")[0]).attr('href')
						href = href.substring(7,href.indexOf('&sa=U&ved=0'));
						//href = 'http://smmry.com/'+href+'#&SM_LENGTH=1&SM_KEYWORD=82';
						if(href.indexOf('.pdf')>0 
						|| href.indexOf('.ppt')>0 
						|| href.indexOf('linkedin')>0
						|| href.indexOf('facebook.com')>0
						|| href.indexOf('github.com')>0
						|| href=='/search'
						|| href.indexOf('twitter.com')>0){
							console.log('"#*#*#*# Not Added in list:'+href);
						}
						else{
							console.log('"#*#*#*# Added in list:'+href);
							hrefList.push(href)
						}
					}
					else{
						console.log("No hyperlink")
					}
				}
				console.log("#*#*#*# All Link List:"+hrefList);
				nextCalls(glob,hrefList)
            });
            resO.on('err', function (err) 
            {
                glob.attributes.speechOutput = err.message;
                glob.emit(':tell',glob.attributes.speechOutput);
            });
        });
        httpgetO.on('err', function (err) {
                glob.attributes.speechOutput = err.message;
                glob.emit(':tell',glob.attributes.speechOutput);
        });
		///////////////////////////////////////////////
		// wait //		
		//This is useless///for(var i = 0; i < 10000000; i++){for(var j = 0; j < 20; j++){}}		
		///wait end//
		
		
		
	}
		
	
}

function cleanText(speechText){
	console.log('cleaning data');
	var returnText = speechText.replace(/&.*;/, '').replace(/[^a-zA-Z0-9 .,:!?]/g, "");
	return returnText;
}
function nextCalls(glob,hrefList){
	var counter = 0;
	//hrefList[0] = 'http://smmry.com/http://bgr.com/2017/07/19/android-vs-ios-market-share-2017-q2/#&SM_LENGTH=1&SM_KEYWORD=82';
	
	//for(var i =0;i<hrefList.length;i++){
		var str = '';
		var sentCount = 3
		try{
			var headers = {
				'Content-Type':'application/x-www-form-urlencoded'
			}
			console.log('Getting link : '+ hrefList[0]);
			// Configure the request
			var options = {
				url: 'https://www.tools4noobs.com/',
				method: 'POST',
				headers: headers,
				form: {
					'action': 'ajax_summarize',
					'url': hrefList[0],
					'threshold':70 ,
					'min_sentence_length':50,
					'min_word_length':4,
					'first_best':10,
					'show_sentences':'checked'
					}
			}
			// Start the request
			request(options, function (error, response, body) {
				if (!error && response.statusCode == 200) {

					var $ = cheerio.load(body)
					var t = $($('ol')[0]).find('li')
					var maxSent = t.length>sentCount?sentCount:t.length;
					var speechOutput = ''
					for(var t_l=0;t_l<maxSent;t_l++){
						speechOutput+=$(t[t_l]).text()+' '
					}
					speechOutput = cleanText(speechOutput)
					console.log('#*#*#*# ['+speechOutput.split(' ').length+'] speechOutput: '+speechOutput)
					if(speechOutput.trim().length>0){
						glob.attributes.speechOutput = speechOutput;
						glob.emit(':tell',glob.attributes.speechOutput);
					}
					else{
						options.form.url=  hrefList[1]
						console.log('Getting link : '+options.form.url);
						request(options, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								$ = cheerio.load(body)
								t = $($('ol')[0]).find('li')
								maxSent = t.length>sentCount?sentCount:t.length;
								speechOutput = ''
								for(var t_l=0;t_l<maxSent;t_l++){
									speechOutput+=$(t[t_l]).text()+' '
								}
								speechOutput = cleanText(speechOutput)
								console.log('#*#*#*# ['+speechOutput.split(' ').length+'] speechOutput: '+speechOutput)
								if(speechOutput.trim().length>0){
									glob.attributes.speechOutput = speechOutput;
									glob.emit(':tell',glob.attributes.speechOutput);
								}
								else{
									options.form.url=  hrefList[2]
									console.log('Getting link : '+options.form.url);
									request(options,{timeout: 1500}, function (error, response, body) {
										if (!error && response.statusCode == 200) {
											$ = cheerio.load(body)
											t = $($('ol')[0]).find('li')
											maxSent = t.length>sentCount?sentCount:t.length;
											speechOutput = ''
											for(var t_l=0;t_l<maxSent;t_l++){
												speechOutput+=$(t[t_l]).text()+' '
											}
											speechOutput = cleanText(speechOutput)
											console.log('#*#*#*# ['+speechOutput.split(' ').length+'] speechOutput: '+speechOutput)
											if(speechOutput.trim().length>0){
												glob.attributes.speechOutput = speechOutput;
												glob.emit(':tell',glob.attributes.speechOutput);
											}
											else{
												options.form.url=  hrefList[3]
												console.log('Getting link : '+options.form.url);
												request(options, function (error, response, body) {
													if (!error && response.statusCode == 200) {
														$ = cheerio.load(body)
														t = $($('ol')[0]).find('li')
														maxSent = t.length>sentCount?sentCount:t.length;
														speechOutput = ''
														for(var t_l=0;t_l<maxSent;t_l++){
															speechOutput+=$(t[t_l]).text()+' '
														}
														speechOutput = cleanText(speechOutput)
														console.log('#*#*#*# ['+speechOutput.split(' ').length+'] speechOutput: '+speechOutput)
														if(speechOutput.trim().length>0){
															glob.attributes.speechOutput = speechOutput;
															glob.emit(':tell',glob.attributes.speechOutput);
														}
														else{
															console.log("#*#*#* Blank response")
															glob.attributes.speechOutput = 'I am still learning, please try again with another question!';
															glob.attributes.repromptSpeech = 'Go ahead! You can literally ask me anything!'
															glob.emit(':ask',glob.attributes.speechOutput,glob.attributes.repromptSpeech);
				
														}
													}
													else{
														console.log("#*#*#* error in 3:"+error.message)
														/* 					glob.attributes.speechOutput = 'I did not understand the request, please try again with another query';
																			glob.attributes.repromptSpeech = 'Go ahead! You can literally ask me anything!'
																			glob.emit(':ask',glob.attributes.speechOutput,glob.attributes.repromptSpeech);
														 */				
													}
												})
											}
										}
										else{
											console.log("#*#*#* error in 2:"+error.message)
											/* 					glob.attributes.speechOutput = 'I did not understand the request, please try again with another query';
																glob.attributes.repromptSpeech = 'Go ahead! You can literally ask me anything!'
																glob.emit(':ask',glob.attributes.speechOutput,glob.attributes.repromptSpeech);
											 */				
										}
									})
								}
							}
							else{
								console.log("#*#*#* error in 1:"+error.message)
/* 					glob.attributes.speechOutput = 'I did not understand the request, please try again with another query';
					glob.attributes.repromptSpeech = 'Go ahead! You can literally ask me anything!'
					glob.emit(':ask',glob.attributes.speechOutput,glob.attributes.repromptSpeech);
 */				
							}
						})
					}
				}
				else{
					console.log("#*#*#* error in 0:"+error.message)
/* 					glob.attributes.speechOutput = 'I did not understand the request, please try again with another query';
					glob.attributes.repromptSpeech = 'Go ahead! You can literally ask me anything!'
					glob.emit(':ask',glob.attributes.speechOutput,glob.attributes.repromptSpeech);
 */				}
			})
		}
		catch(e){
			console.log("#*#*#* error:"+e.message)
			glob.attributes.speechOutput = 'I did not understand the request, please try again with another query';
			glob.attributes.repromptSpeech = 'Go ahead! You can literally ask me anything!'
			glob.emit(':ask',glob.attributes.speechOutput,glob.attributes.repromptSpeech);
		}
		/*glob.attributes.speechOutput = 'Sorry, I did not understand the request, please try again with another query';
		glob.attributes.repromptSpeech = 'Go ahead! You can literally ask me anything!'
		glob.emit(':ask',glob.attributes.speechOutput,glob.attributes.repromptSpeech);*/
		
		// wait //
		//for(var i = 0; i < 10000000; i++){for(var j = 0; j < 5; j++){}}
		//////////
	//}
}

exports.handler = function (event,context,callback){
	const alex= Alexa.handler(event,context);
	alex.APP_ID = APP_ID;
	alex.registerHandlers(handlers)
	
	alex.execute();
}
