//wrapper for the db
const sequelize = require(`${require.main.path}/src/sequelize.js`);
require(`${require.main.path}/tbl`);

module.exports = sequelize.models;
