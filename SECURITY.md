# Security Policy

## Supported versions

This kit is pre-1.0. Only the latest `main` receives fixes.

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

Use GitHub's private reporting:
[Report a vulnerability](https://github.com/nguyenan97/angular-saas-kit/security/advisories/new).

Expect an acknowledgement within 72 hours and an assessment within a week.
This is a side project maintained by one person, so please be patient — but if
you have had no reply in two weeks, escalate by opening a public issue that
says only that a private report is unanswered, with no details.

## Scope

This is a UI template with no backend and no authentication implementation.
The mock API in `libs/mock-api` is for local development only and must never
be shipped to production. Reports about it will be closed as out of scope
unless they describe a way it can be enabled accidentally in a production
build.

In scope: XSS via component inputs, dependency vulnerabilities, anything in
the build output that leaks source or environment data.
