# Security Considerations

There are important risks to consider when mapping GitHub Actions OIDC token
claims.


## Use Unique Mapping Values

Many of the claims embedded in the GitHub Actions OIDC token are not guaranteed
to be unique, and tokens issued by other GitHub organizations or repositories
may contain the same values, allowing them to establish an identity. To protect
against this situation, always use an Attribute Condition to restrict access to
tokens issued by your GitHub organization.

```cel
assertion.repository_owner == 'my-github-org'
```

Never use a "*" in an IAM Binding unless you absolutely know what you are doing!


## Use GitHub's Numeric, Immutable Values

Using "name" fields in Attribute Conditions or IAM Bindings like `repository` and `repository_owner` increase the chances of [cybersquatting][] and [typosquatting][] attacks. If you delete your GitHub repository or GitHub organization, someone could claim that same name and establish an identity. To protect against this situation, use the numeric `*_id` fields instead, which GitHub guarantees to be unique and never re-used.

To get your numeric organization ID:

```sh
ORG="my-org" # TODO: replace with your org
curl -sfL -H "Accept: application/json" "https://api.github.com/orgs/${ORG}" | jq .id
```

To get your numeric repository ID:

```sh
REPO="my-org/my-repo" # TODO: replace with your full repo including the org
curl -sfL -H "Accept: application/json" "https://api.github.com/repos/${REPO}" | jq .id
```

These can be used in an Attribute Condition:

```cel
assertion.repository_owner_id == '1342004' && assertion.repository_id == '260064828'
```

[cybersquatting]: https://en.wikipedia.org/wiki/Cybersquatting
[typosquatting]: https://en.wikipedia.org/wiki/Typosquatting
