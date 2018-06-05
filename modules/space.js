'use strict';



module.exports = function(app, theBot) {

	const bot = theBot;
	const debug = require('debug');
	const log = debug('dpc-exportspace-space');
	const rp = require('request-promise');
	const url = require('url');
	const bodyParser = require('body-parser');
	app.use(bodyParser.json());

	/**
	 * get a list of spaces
	 */
	app.get('/getSpaces', function(req,res) {
		const userId = req.session.dpcExportSpace; // get userId from session
		if (userId && bot.asUser(userId)) { // check to see if we've timed out
			getSpaces(userId)
			.then(result => {
				res.json(result);
			})
			.catch(err => {
				log('error calling getSpaces, status = %d and message = %s', err.status, err.message);
				res.status(500).json({'error':'status = ' + err.status + ', message = ' + err.message});
			});
		} else {
			log('no userId found');
			res.status(500).json({error:'User is not logged in!'});
		}
	});

	/**
	 * getSpaces executes a GraphQL query to retrieve the spaces of which the user is a member
	 * @param userId {string} the userId of the Workspace user
	 * @returns {object} a Promise which resolves to the JSON list of spaces
	 */
	function getSpaces(userId) {
		return new Promise(function(resolve, reject) {
			log('----> entering getSpaces with userId', userId);
			var fields = ['id','title', 'updated'];
			let query = `query getSpaces {
				spaces {
				items {
					id
					title
					updated
				}
				}
			}
			`;

			bot.asUser(userId).sendGraphql(query)
			.then(result => {
				resolve(result.spaces.items);
			})
			.catch(err => {
				log('error getting spaces:', err);
				reject(err);
			});
		});
	}
}
