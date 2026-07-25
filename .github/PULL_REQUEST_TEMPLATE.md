## Description

<!-- Summarize the change. Link to any related issues or contracts. -->

## CI Status (do not merge until all pass)

- [ ] `Build, Lint & Type Check` — `bun run lint && bun run type:check && bun run build`
- [ ] `Test` — `bun run test`
- [ ] Vercel deploy preview passes (if applicable)

## Compliance Checklist

- [ ] My commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`type(scope): message`)
- [ ] I have run `bun run format` before committing (or let lint-staged handle it)
- [ ] No `.env*.local`, `node_modules`, or lockfile churn
- [ ] No generated artifacts committed (cache output, build output, bundled config)
- [ ] Contract ABI changes reflected in `src/contracts/` (if applicable)
- [ ] Config changes tracked in `config/default.json` (if applicable)

## Additional Context

<!-- Anything reviewers should know: migration steps, env changes (Vercel), breaking contract changes, related PRs across NiftyLeague repos. -->
