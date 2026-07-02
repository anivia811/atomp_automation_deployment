# make nodejs 8 global
export PATH=$PWD/node-v8.17.0-linux-x64/bin:$PATH

cd createuser

# $1 is user email. Example: "vuonganhtuan@gmail.com"
# $2 is user full name. Example: "Vuong Anh Tuan"
node createuser.js "admin@atomp.io" "ADMIN" 1
