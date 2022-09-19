docker run \
--env "AWS_ACCESS_KEY_ID"=$AWS_ACCESS_KEY_ID \
 --env "AWS_SECRET_ACCESS_KEY"=$AWS_SECRET_ACCESS_KEY \
 --env "AWS_DEFAULT_REGION"="ap-south-1" \
 --env "HOST"="0.0.0.0" \
 --network="host" \
 sgf-strapi

.



