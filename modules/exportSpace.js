


module.exports = function(app, theBot) {
	'use strict';
	const bot = theBot;

	const url = require('url');
	const debug = require('debug');
	const log = debug('dpc-exportspace-export');
	var archiver = require('archiver');


	/**
	 * Export the messages and files from the selected space
	 */
	app.get('/exportSpace', (req,res) => {
		const qs = url.parse(req.url,true).query;
	  	const spaceId = qs.id;
		const userId = req.session.dpcExportSpace;
		// log('userId', userId);
		if (userId && bot.asUser(userId)) {
			exportSpace(userId, spaceId)
		  	.then(result => {			  
				log('got result when calling exportSpace!');
			  	getFiles(result.conversation.messages.items, userId)
			  	.then(somefiles => {
					let output = '';
					for ( let i = result.conversation.messages.items.length - 1; i > -1; i-- ) {
						// if an app is removed from the space, the message is still there but without creator info
						const displayName = result.conversation.messages.items[i].createdBy ? 
							result.conversation.messages.items[i].createdBy.displayName :
							'unknown';
						const email = result.conversation.messages.items[i].createdBy ?
							result.conversation.messages.items[i].createdBy.email :
							'unknown';
						// the content field is populated if the message was posted by a user
						// but not if it was posted by an app
						const content = result.conversation.messages.items[i].content ?
							result.conversation.messages.items[i].content :
							getContentPostedByApp(result.conversation.messages.items[i].annotations);
						output += `"${displayName}","${email}",`
						+ `"${result.conversation.messages.items[i].updated}",`
						+ `"${content}"`
						+ '\n';
					}
					somefiles.append(output, { name: 'transcript.csv'});
					somefiles.finalize();			
					res.setHeader('Content-disposition', 'attachment; filename=spacefiles.zip');
					res.set('Content-Type', 'application/zip'); 
					somefiles.pipe(res);
			  	})
				.catch(err => {
					log('error getting files:', err.statusCode, err.message);
					const errMsg = 
						'Sorry! There was a problem getting the files. Please go back and choose another space.'
						+ '<br/><br/>The status code is ' + err.statusCode + ' and the message is ' + err.message + '.';
					res.type('text/html').end(errMsg);
				});
			})
			.catch(err => {
					log('error in export: status = %d and message = %o', err.status, err.message);
					res.status(500).json({error:err.message});
			});
		} else {
			res.type('text/html').end('It looks like you are not logged in. <a href="/login">Start over</a>?');
		}
  });


	/**
	 * exportSpace execute GraphQL to get a set of messages from a Space
	 * @param userId {string} the Workspace user Id
	 * @param spaceId {string} the unique Id of this Space
	 * @returns {object} a promise which resolves to JSON containing an array of messages
	 */
	function exportSpace(userId, spaceId) {
		return new Promise((resolve, reject) => {
			var query = `query getSpace {
			space(id: "${spaceId}") {
				title
				conversation {
					messages(first : 50)
			   	{
					items {
						content
						updated
						id
						contentType
						createdBy {
						displayName
						photoUrl
						email
					}
					annotations
					}
					}
				}
				}
			}`
			;
			
			bot.asUser(userId).sendGraphql(query)
			.then(result => {
				resolve(result.space);
			})
			.catch(err => {
				reject(err);
			});
		});
	}

	/**
	 * getFiles given an array of messages, go through and find any file annotations.
	 * For each annotation, retrieve the file.
	 * @param {*} messages a JSON array of messages
	 * @param {*} userId the Workspace userId
	 */
	function getFiles(messages, userId) {
		return new Promise((resolve, reject) => {
			log('----> entering getFiles');
			let promises = [];
			// go through the messages, looking for file annotations
			// if found, add it to an array of promises
			for (let i = 0, messagesLength = messages.length; i < messagesLength; i++) {
				if (messages[i].annotations) {
					for (let j = 0; j < messages[i].annotations.length; j++) {
						const annotation = JSON.parse(messages[i].annotations[j]);
						if (annotation.type === 'file') {
							log('found a file!');
							promises.push(getOneFile(annotation, userId));
						}
					}
				}
			}
			Promise.all(promises) // process all promises once they've all returned
			.then(allData => {
				// create an archive object to house the files
				var archive = archiver('zip', {
					zlib: { level: 9 }
				});
				
				// catch warnings (ie stat failures and other non-blocking errors)
				archive.on('warning', function(err) {
					if (err.code === 'ENOENT') {
						log('warning in archiving:', err);
					} else {
						log('error in archiving:', err);
					}
				});
				
				// catch this error explicitly
				archive.on('error', function(err) {
					log('error in archiving', err);
				});

				// compress streams (which are the file contents)
				for (let k = 0; k < allData.length; k++) {
					archive.append(allData[k].stream, { name: allData[k].name});
				}
				// and done!
				resolve(archive);

			})
			.catch(err => {
				log('error getting files:', err.statusCode, err.message);
				reject(err);
			});
		});
	}

	/**
	 * getOneFile uses the workspace bot framework to get the file using its fileId
	 * @param {*} annotation 
	 * @param {*} userId 
	 * @returns a Promise containing the file name and its contents as a stream
	 */
	function getOneFile(annotation, userId) {
		return new Promise((resolve, reject) => {
			log('---> entering getOneFile with fileId:');
			bot.asUser(userId).getFile(annotation.fileId)
			.then(fileStream => {
				log('returning a file');
				resolve({
					name: annotation.name,
					stream: fileStream
				});
			})
			.catch(err => {
				reject(err);
			})
		});

	}

	/**
	 * The message was apparently posted by an app, since its 'content' is empty. 
	 * Find the generic annotation and return its text value.
	 * @param {array} annotations 
	 * @returns a string which is the text the app posted to the space.
	 */
	function getContentPostedByApp(annotations) {
		for (let i = 0; i < annotations.length; i++) {
			const annotation = JSON.parse(annotations[i]);
			if (annotation.type === 'generic') {
				i = annotations.length; // found the annotation so bail
				return annotation.text;
			}
		}
	}
}

