# How to preamble the GPL license text

Using `find {PROJECT} -iname "node_modules" -prune -o -iname "*.ts" -exec sh -c 'cat preamble-gpl-license-text.ts $0 > $0.added.ts; mv $0.added.ts $0' {} \;` where `{PROJECT}` gets replaced by the following:

* `preiserfasser/preiserfasser-tablet`
* `backoffice/backoffice-browser`
* `lik-shared`
