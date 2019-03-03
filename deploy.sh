ssh -n -f root@flou.app "sh -c 'cd /var/www/html && rm -rf * && exit'"
npm run build --prod && scp -r ./dist/flou/* root@flou.app:/var/www/html
