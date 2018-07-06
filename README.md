GrantDash
=========

Grants Submission Dashboard based on [HackDash](http://hackdash.org)

## Quick Start

### Update Power Page / Submodule Update 

 * 在 power repo deploy 之後，還需要再更新 grant repo. 請到 grant 根目錄下執行這些指令:
   ```
   git pull
   git submodule foreach git pull
   git add public/power
   git commit -m "update submodule"
   git push
   ```



### Development

```
docker-compose build
docker-compose run --rm -p 3000:3000 app
```

You might want to import the stub data to get started:

```
docker-compose run --rm mongodb mongoimport --host mongodb --db hackdash --collection dashboards --file /dev/stdin < ./data/dashboards.json
```

### Produection

```
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

For setting up SSL, consider using [Docker letsencrypt nginx proxy companion]](https://github.com/JrCs/docker-letsencrypt-nginx-proxy-companion).

## Config

### Basics

See config/config.json.sample and key.json.sample.

### Discourse Integration

Each submitted project will have discourse embedded if you configure `discourseUrl`.  Make sure you have the correct embed settings in the discourse instance to have posts automatically created in the right category.

If you configure `discourseSsoSecret`, the GrantDash instance will provide sso user account for discourse.  In discourse, configure the sso url to be `*hackdash-instance.host*/api/v2/sso`, and make sure the sso secret is the same for discourse and grantdash.

## License

[MIT](https://g0v.mit-license.org)

Based on HackDash (c) Dan Zajdband under The MIT License.
