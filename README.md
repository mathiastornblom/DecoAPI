# DecoAPIWapper

DecoAPIWapper is a Node.js-based project designed for making it easy to get information out of tp-link deco routers. This project utilizes various cryptographic utilities and provides a robust testing suite to ensure functionality.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Installation

To get started with DecoAPI, clone the repository and install the necessary dependencies:

```bash
git clone https://github.com/mathiastornblom/DecoAPIWaper.git
cd DecoAPIWaper
npm install
```

## Usage

Provide a brief description of how to use the project. For example:

```bash
import DecoAPIWraper from 'decoapiwrapper';

const client = new DecoAPIWraper(process.env.DECO_IP || '');
await client.authenticate(decoPassword);
```

### Environment Variables

The project uses environment variables defined in the `.env` file. Make sure to configure them appropriately before running the project.

- `DECO_IP`: IP of your router
- `DECO_PASSWORD`: the password for your tp-link app

## Testing

DecoAPI includes a suite of tests to ensure the integrity of the code. To run the tests, use the following command:

```bash
npm test
```

## Project Structure

A brief overview of the project's structure:

```plaintext
DecoAPI/
├── src/              # Source files
│   ├── client.ts     # Client-related logic
│   ├── deco.ts       # Main entry point
│   └── utils/        # Utility functions (e.g., AES, RSA encryption)
├── tests/            # Test files
│   └── client.test.ts# Unit tests for client
├── .env              # Environment variables
├── .gitignore        # Git ignore rules
├── package.json      # Project dependencies and scripts
└── README.md         # Project documentation
```

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes. Make sure to follow the code style guidelines and include relevant tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
