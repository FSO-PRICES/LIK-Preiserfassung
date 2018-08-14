## How to preamble the GPL license text

Using `find {PROJECT} -iname "node_modules" -prune -o -iname "*.ts" -exec sh -c 'cat preamble-gpl-license-text.ts $0 > $0.added.ts; mv $0.added.ts $0' {} \;` where `{PROJECT}` gets replaced by the following:

-   `preiserfasser/preiserfasser-tablet`
-   `backoffice/backoffice-browser`
-   `lik-shared`

## How to create a publishable licensed code branch

1. `git branch -d latest_licensed`
2. `git push origin --delete latest_licensed`
3. Checkout the desired branch/code base to license
4. `git checkout -b latest_licensed`
5. Append the preamble using previously explained steps.
6. `git push --set-upstream origin latest_licensed`
