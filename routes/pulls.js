var express = require('express')
var router = express.Router()
var fs = require('fs')
var path = require('path')
var rimraf = require('rimraf')	//Remove Recursif
var ncp = require('ncp').ncp	//Copy Recursif
ncp.limit = 3
var utils = require('../utils')

router
	.get('/', (req, res, next) => {

		fs.readdir(req.paths.pull, (err, pulls) => {

			pulls = pulls.map(pull => {
				return {
					log: utils.getLastLog(path.join(req.paths.pull, pull)),
					time: Number(pull.split('_')[1]),
					pull: pull.split('_')[0],
					path: path.join(req.paths.pull, pull)
				}
			})

			res.json(pulls)

		})
		
	})
	.post('/accept/:folder', (req, res, next) => {
		var name = req.params.folder.split('_')[0]
		var time = req.params.folder.split('_')[1]
		var source = path.join(req.paths.pull, req.params.folder)
		var destination = path.join(req.paths.backup, name, String(new Date().getTime()))
		ncp(source, destination, err => {
			if (!err) {
				destination = path.join(req.paths.master, name)
				ncp(source, destination, err => {
					if (!err) {
						rimraf(source, err => {
							if (!err) {
								res.json({success: true, message: 'Modification accepté'})
							}else next(err)
						})
					}else next(err)
				})
			}else next(err)
		})
	})
	.post('/remove/:folder', (req, res, next) => {
		rimraf(path.join(req.paths.pull, req.params.folder), err => {
			if (!err) {
				res.json({success: true, message: `Le dossier ${req.params.folder} à été correctement supprimé !`})
			}else next(err)
		})
	})



module.exports = router