
async function getPageTemplateByName(authToken: string, hostname: string, pageTemplateName: string){
    const axios = require('axios');
    const data = JSON.stringify({
    query: `query getPageTemplates {
        virtualization {
            getPageTemplates {
                pageTemplateId
                name
                displayName
                layoutTemplateId
                vocabularyKeysCore
                vocabularyKeysNonCore
                suggestedSearchEnabled
                metricsEnabled
                layoutTemplate {
                Id
                Name
                DisplayName
                Description
                GridConfiguration
                Icon
                OrganizationId
                Order
                }
            }
        }
    }
    `,
    variables: {
    }
    });

    const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://' + hostname + '/graphql',
    headers: { 
        'Content-Type': 'application/json', 
        'Authorization': 'Bearer ' + authToken
    },
    data : data
    };

    return axios.request(config)
    .then((response: any) => {
    if (response.data.errors != null && response.data.errors.length > 0){
        throw new Error(response.data.errors[0].message);
    }

    return response.data.data.virtualization.getPageTemplates.find(function(x: any) { return x.name == pageTemplateName; });
    })
    .catch((error: Error) => {
    console.log(error);
    throw error;
    });
}

export default { getPageTemplateByName };
