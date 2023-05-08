cd packages/medusa-strapi
echo 'starting strapi test'
bash -c NODE_ENV=test yarn start ; sleep 30
echo 'executing test'

cd -
cd packages/medusa-plugin-strapi-ts
yarn test
kill 0