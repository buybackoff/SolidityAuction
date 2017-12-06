abi:
	@npm run dist

dev: 
	@$(shell pwd)/node_modules/.bin/cross-env \
		WEB3=http://pub-node1.etherscan.io:8545\
		PRIVATE_KEY=YOUR_PRIVATE_KEY\
		FROM=YOUR_ADDRESS\
		GAS_PRICE=1000000\
		DEBUG=error,warning,info,log,verb \
		$(shell pwd)/node_modules/.bin/nodemon $(shell pwd)app.js $@ --exec $(shell pwd)/node_modules/.bin/babel-node

run:
	@$(shell pwd)/node_modules/.bin/cross-env \
		WEB3=http://pub-node1.etherscan.io:8545\
		PRIVATE_KEY=YOUR_PRIVATE_KEY\
		FROM=YOUR_ADDRESS\
		GAS_PRICE=1000000\
		DEBUG=error,warning,info,log \
		$(shell pwd)/node_modules/.bin/babel-node $(shell pwd)/app.js $@

install:
	@npm install
