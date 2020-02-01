'use strict';

const { getUser } = require('./src/controllers/get-user-names.js') 

getUser('1234')
    .then(user => {
        console.log(user)
    })
    .catch(err => console.log(err))