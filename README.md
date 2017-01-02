GrantDash
=========

Grants Submission Dashboard based on [HackDash](http://hackdash.org)

## Quick Start

```
docker-compose build
docker-compose run -p 3000:3000 app
```

## Config

### Basics

See config/config.json.sample and key.json.sample.

### Discourse Integration

Each submitted project will have discourse embedded if you configure `discourseUrl`.  Make sure you have the correct embed settings in the discourse instance to have posts automatically created in the right category.

If you configure `discourseSsoSecret`, the GrantDash instance will provide sso user account for discourse.  In discourse, configure the sso url to be `*hackdash-instance.host*/api/v2/sso`, and make sure the sso secret is the same for discourse and grantdash.

## License

[MIT](https://g0v.mit-license.org)

Based on HackDash (c) Dan Zajdband under The MIT License.
