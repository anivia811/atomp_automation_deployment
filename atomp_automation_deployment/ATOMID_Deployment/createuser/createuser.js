const Sequelize = require('sequelize');
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy")
//Config db mysql
const sequelize = new Sequelize('atomid', 'atomp', 'atomp@12345', {
     host: '10.20.0.3',
     port: '3306',
     dialect: 'mysql',
     pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
     }
});
const tableOptions = {
     timestamps: true
};
//User
const User = sequelize.define('users', {
     id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
     },
     email: {
          type: Sequelize.STRING,
          unique: true
     },
     full_name: {
          type: Sequelize.STRING,
          allowNull: true
     },
     salt: {
          type: Sequelize.STRING,
          allowNull: false
     },
     nationality: {
          type: Sequelize.STRING,
          allowNull: false
     },
     country_code: {
          type: Sequelize.STRING,
          allowNull: true
     },
     phone: {
          type: Sequelize.STRING,
          allowNull: true
     },
     address: {
          type: Sequelize.STRING,
          allowNull: true
     },
     birth_day: {
          type: Sequelize.STRING,
          allowNull: true
     },
     gender: {
          type: Sequelize.STRING,
          allowNull: true
     },
     status: {
          type: Sequelize.TINYINT,
          allowNull: false,
          defaultValues: 0,
     },
     otp_issued_in: {
          type: Sequelize.DOUBLE,
          allowNull: false
     },
     role: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValues: 1
     },
     secret_key: {
          type: Sequelize.STRING,
          allowNull: false
     },
     avatar_url: {
          type: Sequelize.STRING,
          allowNull: true
     },
     lang: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValues: 'en'
     }
}, tableOptions);
//User Password
const UserPassword = sequelize.define('users_passwords', {
     id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
     },
     user_id: {
          type: Sequelize.INTEGER,
          allowNull: false
     },
     hash_password: {
          type: Sequelize.STRING,
          allowNull: false
     },
     status: {
          type: Sequelize.TINYINT,
          allowNull: false,
     },
}, tableOptions)
const createSecretKey = async () => {
     return speakeasy.generateSecret().ascii
}
const hashPassword = async (password, salt) => {
     const hash = await bcrypt.hash(password, salt)
     return hash
}
const createSalt = async () => {
     const salt = await bcrypt.genSalt(10)
     return salt
}
const savePassword = async (options) => {
     const userData = UserPassword.create({
          user_id: options.user_id,
          hash_password: options.hash_password,
          status: 2
     })
     return userData.dataValues
}
const createUser = async (options) => {
     const secret_key = await createSecretKey()
     const salt = await createSalt()
     const hash_password = await hashPassword(options.password, salt)
     User.create({
          email: options.email.replace(/\.(?=.*?@\w+)/g, '').toLowerCase(),
          full_name: options.full_name,
          salt: salt,
          nationality: options.nationality,
          status: 2,
          otp_issued_in: options.otp_issued_in,
          role: parseInt(process.argv[4]) || 2,
          avatar_url: null,
          secret_key: secret_key,
          lang: 'en'
     }).then((user) => {
          savePassword({
               user_id: user.id,
               hash_password: hash_password
          })
     })
}
function password_generator(len) {
     var length = (len) ? (len) : (10);
     var string = "abcdefghijklmnopqrstuvwxyz"; //to upper
     var numeric = '0123456789';
     var punctuation = '!@#$%^&*';
     var password = "";
     var character = "";
     while (password.length < length) {
          entity1 = Math.ceil(string.length * Math.random() * Math.random());
          entity2 = Math.ceil(numeric.length * Math.random() * Math.random());
          entity3 = Math.ceil(punctuation.length * Math.random() * Math.random());
          hold = string.charAt(entity1);
          hold = (password.length % 2 == 0) ? (hold.toUpperCase()) : (hold);
          character += hold;
          character += numeric.charAt(entity2);
          character += punctuation.charAt(entity3);
          password = character;
     }
     password = password.split('').sort(function () { return 0.5 - Math.random() }).join('');
     return password.substr(0, len);
}
//Set info user
const password = password_generator(10);
console.log('Password: ', password)
const options = {
     email: process.argv[2],
     password: password,
     full_name: process.argv[3],
     nationality: "vi",
     otp_issued_in: -1,
     avatar_url: null,
     role: process.argv[4] || 2
}
//Create User
createUser(options);
