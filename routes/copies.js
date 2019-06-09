var express = require('express')
var router = express.Router()
var fs = require('fs')
var path = require('path')
var utils = require('../utils')
var rimraf = require('rimraf')	//Remove Recursif
var ncp = require('ncp').ncp	//Copy Recursif
ncp.limit = 3

router
	.get('/', (req, res, next) => {
		fs.readdir(req.paths.copy, (err, sections) => {
			if (!err) {
				var copies = []
				sections.forEach(section => {
					copies = [...copies, ...fs.readdirSync(path.join(req.paths.copy, section)).map(copy => {
						return {
							name: copy,
							section,
							log: utils.getLastLog(path.join(req.paths.copy, section, copy)),
							time: utils.getLastTime(path.join(req.paths.copy, section, copy)),
							path: path.join(req.paths.copy, section, copy)
						}
					})]
				})
				res.json(copies)
			}else next(err)
		})
	})
	.post('/', (req, res, next) => {
		if (req.body.section) {
			var source = path.join(req.paths.master, req.body.master)
			var destination = path.join(req.paths.copy, req.body.section, req.body.master)
			//Evite l'absence de log
			fs.access(path.join(destination, 'CHANGELOG.md'), err => {
				if (!err) fs.unlinkSync(path.join(destination, 'CHANGELOG.md'))
				ncp(source, destination, err => {
					if (!err) 
						utils.writeLog(destination, `Copie pour ${req.body.log}`, err => {
							if (!err) {
								res.json({success: true})
							}else next(err)
						})
					else next(err)
				})	
			})
		}else next(Error('Section non défini !'))
	})
	.post('/sections', (req, res, next) => {
		fs.mkdir(path.join(req.paths.copy, req.body.section), err => {
			if (!err) {
				res.json({success: true, message: 'Section crée avec succèes !'})
			}else next(err)
		})
	})
	.get('/sections', (req, res, next) => {
		fs.readdir(path.join(req.paths.copy), (err, files) => {
			if (!err) {
				res.json(files)
			}else next(err)
		})		
	})
	.get('/sections/:section', (req, res, next) => {
		fs.readdir(path.join(req.paths.copy, req.params.section), (err, files) => {
			if (!err) {
				res.json(files)
			}else next(err)
		})		
	})
	.get('/folder/:folderName', (req, res, next) => {
		fs.readdir(path.normalize(req.paths.copy), (err, sections) => {
			if (!err) {
				var copies = []
				sections.forEach(section => {
					var folders = fs.readdirSync(path.join(req.paths.copy, section))
					copies = [...copies, ...folders.filter(folder => folder == req.params.folderName)]
				})
				res.json(copies)
			}else next(err)
		})		
	})
	.get('/:section/:folderName', (req, res, next) => {
		fs.readdir(path.join(req.paths.copy, req.params.section, req.params.folderName), (err, files) => {
			if (!err) {
				res.json(files)
			}else next(err)
		})
	})
	.post('/:section/:folderName/remove', (req, res, next) => {
		rimraf(path.join(req.paths.copy, req.params.section, req.params.folderName), err => {
			if (!err) {
				res.json({success: true, message: `Copy ${req.params.folderName} deleted`})
			}else next(err)
		})
	})
	.post('/:section/:folderName/pull', (req, res, next) => {
		var source = path.join(req.paths.copy, req.params.section, req.params.folderName)
		var destination = path.join(req.paths.pull, `${req.params.folderName}_${new Date().getTime()}`)
		utils.writeLog(path.normalize(source), req.body.comment, err => {
			if (!err) {
				ncp(source, destination, err => {
					if (!err) res.json({success: true})
					else next(err)
				})
			}else next(err)			
		})
	})

module.exports = router