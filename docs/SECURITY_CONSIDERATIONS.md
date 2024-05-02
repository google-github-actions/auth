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


## Set up Repository & Branch Protection

An attribute condition checking just the `repository_owner` assertion is most likely insufficient. Since your workflow may access secrets and other sensitive cloud resources, it should only be run on trusted code. Untrusted code can come from other repositories in the same organization, or even unreviewed branches in the same repository. The only code that should be trusted is code that has been reviewed and merged into a protected main branch.

To restrict access to a workflow on your main branch, you'll need to do the following:

1. Map the necessary GitHub assertions to Google STS token attributes.
2. Create attribute conditions that are verified whenever a GitHub OIDC token is exchanged for a Google STS token.

### Mapping GitHub Assertions to Google STS Token Attributes

You can use the following mappings to provide Google with enough information to verify the GitHub OIDC token.

```
attribute.repository = assertion.repository
attribute.event_name = assertion.event_name
attribute.base_ref   = assertion.base_ref
attribute.ref        = assertion.ref
attribute.workflow   = assertion.workflow
```

More information about each claim from the GitHub OIDC token can be found [here](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud).

### Create Attribute Conditions for Protected Main Branch

Once the GitHub assertions have been mapped to Google STS token attributes, you can create attribute conditions to verify that the caller is coming from a trusted source. For example, the following conditions verify that the GitHub OIDC token was generated after a push to the `main` branch of the `octo-org/octo-repo` repository.

```
attribute.repository == "octo-org/octo-repo" && \
  attribute.event_name == "push" && \
  attribute.ref == "refs/heads/main"
```

You can also use the `workflow` attribute if you want to restrict access to specific workflows.

### Scalably Granting Access to Multiple Protected Branches

As your repository grows in complexity, you might create multiple protected branches that access the same cloud resources. Manually adding protected branch names to the attribute conditions can be cumbersome and error-prone. You can simplify the attribute conditions by checking for GitHub Environment names instead of individual branch names.

Suppose you have multiple protected branches (including `main`) that can deploy to a GitHub Environment called `Production`. To trigger a workflow whenever code is pushed to those branches, set a condition in your workflow like this:

```if: github.ref_protected == true && github.event_name == 'push'```

Then, when verifying the claims in Google Cloud, map the `sub` assertion to a `sub` attribute and check this attribute for the `Production` Environment. This will look something like this:

```attribute.sub == "repo:octo-org/octo-repo:environment:Production"```

Since the `Production` environment is a superset of all the protected branches, all the protected branches will have access.

### Create Attribute Conditions for Pull Requests

You may wish to access cloud resources using a less privileged service account when code is submitted as a pull request to the repository. In this case, simply create another set of attribute conditions that allow the caller to retrieve a token to impersonate the less privileged service account.

```
attribute.repository == "octo-org/octo-repo" && \
  attribute.event_name == "pull_request_target" && \
  attribute.base_ref == "main"
```


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
