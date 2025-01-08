# Project Name

A brief description of your Azure DevOps Task project.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Overview

Provide an overview of your Azure DevOps Task project, explaining its purpose and key features.
Tested against CluedIn version 2023.07.02

## Prerequisites

List any prerequisites or dependencies required to use your Azure DevOps Task project.

## Installation

Provide step-by-step instructions on how to install and configure your Azure DevOps Task project.

## Usage

Explain how to use your Azure DevOps Task project, including any configuration options or parameters.

## Contributing

Provide guidelines for contributing to your Azure DevOps Task project, including information on how to submit bug reports or feature requests.

## License

Specify the license under which your Azure DevOps Task project is distributed.



## Connectors

Currently we do not support moving connector settings e.g. connection strings.


## Sample Usage
$env:INPUT_SOURCEPATH="C:\code\Cluedin.Exporter-1\data\"  
$env:INPUT_outputPath="C:\code\Cluedin.Exporter-1\data\"  
 
#dev
$env:INPUT_cluedinUsername="cluedinadmin@guardrisk.co.za"  
$env:INPUT_cluedinPassword=""  
$env:INPUT_cluedinClientId="cluedindev"  
$env:INPUT_cluedinHostname="app-cluedindev.guardrisk.co.za"  
 
#uat
$env:INPUT_cluedinUsername="cluedinadmin@guardrisk.co.za"  
$env:INPUT_cluedinPassword=""  
$env:INPUT_cluedinClientId="cluedinuat"  
$env:INPUT_cluedinHostname="app-cluedinuat.guardrisk.co.za"  
 
#prod
$env:INPUT_cluedinUsername="cluedinadmin@guardrisk.co.za"  
$env:INPUT_cluedinPassword=""  
$env:INPUT_cluedinClientId="cluedin"  
$env:INPUT_cluedinHostname="app-cluedin.guardrisk.co.za"