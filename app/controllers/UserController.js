const User          = require('../models').User;
const Sequelize     = require('sequelize');
const url           = require('url');
const paginate      = require('express-paginate');
const Op            = Sequelize.Op;
const elasticsearch = require('elasticsearch');

const elasticClient = new elasticsearch.Client({  
    host: 'localhost:9200',
    log: 'info'
});

class UserController {
    create(req, res) {
        let user = req.body;
        if(!user.firstName || !user.lastName) {
            return res.status(500).json({
                success: false,
                status: 'firstName or lastName does not exist!'
            });
        }

        User.create({
            firstName: user.firstName,
            lastName: user.lastName,
        }).then((user) => {
            return res.status(200).json(
                {
                    success: true,
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt
                    }
                }
            );
        })
    }

    search(req, res) {
        let url_parts = url.parse(req.url, true);
        let obj = url_parts.query;
        let query_values = Object.values(obj);
        let query;
        if(query_values.length == 0) {
            query = {
                limit: req.query.limit, 
                offset: req.skip
            };
        } else {
            let text = Object.values(obj)[0];
            query = {
                where : Sequelize.or
                (
                    {firstName : { [Op.like] : `%${text}%` }},
                    {lastName : { [Op.like] : `%${text}%` }}
                ),
                limit: req.query.limit, 
                offset: req.skip
            }
        }
        User.findAndCountAll(query).then(users => {
            const itemCount = users.count;
            const pageCount = Math.ceil(users.count / req.query.limit);
            res.json({
                users: users.rows,
                pageCount,
                itemCount,
                pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
            });
            // --> VIEW ENGINE EJS <-- //
            // res.render('index', {
            //   users: users.rows,
            //   pageCount,
            //   itemCount,
            //   pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
            // }); 
        }).catch(err => {
            console.log(err);
        })
    }

    createEl(req, res) {
        let user = req.body;
        if(!user.firstName || !user.lastName) {
            return res.status(500).json({
                success: false,
                status: 'firstName or lastName does not exist!'
            });
        }
        elasticClient.index({
            index: 'test',
            type: "document",
            body: {
                firstName: user.firstName,
                lastName: user.lastName,
            }
        }).then(function (result) { res.json(result) });
    }

    searchEl(req, res) {
        let url_parts = url.parse(req.url, true);
        let obj = url_parts.query;
        let query_values = Object.values(obj);
        let query;
        if(query_values.length == 0) {
            query = {
                "query": {
                    "match_all" : {}
                }
            };
        } else {
            let text = Object.values(obj)[0];
            text = '*' + text + '*';
            query = {
                "query": {
                    "bool": {
                        "should" : [
                            {
                                "wildcard" : {
                                    "firstName": text
                                }
                            },
                            {
                                "wildcard" : {
                                    "lastName": text
                                }
                            }
                        ]
                    }
                }
                
            }
        }
        elasticClient.search({
            index: 'test',
            type: 'document',
            body: query
        }).then(function (response) {
            res.json({
                users: response.hits.hits,
            });
        })
    }
}

module.exports = new UserController();
