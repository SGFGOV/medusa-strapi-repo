docker build \
 -t sgf-strapi \
--build-arg AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
--build-arg AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
--build-arg AWS_DEFAULT_REGION="ap-south-1" \
--no-cache \
.



