import React, {ComponentType, FC, PropsWithChildren, useEffect, useState} from 'react';
import Oidc, {Configuration} from './vanilla/oidc';
import OidcRoutes from './core/routes/OidcRoutes';
import {Authenticating, AuthenticateError, SessionLost, Loading, Callback} from './core/default-component/index';
import ServiceWorkerNotSupported from "./core/default-component/ServiceWorkerNotSupported.component";
import AuthenticatingError from "./core/default-component/AuthenticateError.component";


export type oidcContext = {
    getOidc: Function;
};

const defaultEventState = {name:"", data:null};

type OidcProviderProps = {
    callbackSuccessComponent?: ComponentType;
    callbackErrorComponent?: ComponentType;
    sessionLostComponent?: ComponentType;
    authenticatingComponent?: ComponentType;
    loadingComponent?: ComponentType;
    authenticatingErrorComponent?: ComponentType;
    serviceWorkerNotSupportedComponent?: ComponentType;
    configurationName?: string;
    configuration?: Configuration;
    children: any;
};

type OidcSessionProps = {
    configurationName: string;
    loadingComponent: ComponentType
};


const OidcSession : FC<PropsWithChildren<OidcSessionProps>> = ({loadingComponent, children, configurationName}) =>{
    const [loading, setLoading] = useState(true);
    const getOidc =  Oidc.get;
    useEffect(() => {
        let isMounted = true;
        const oidc = getOidc(configurationName);
        oidc.tryKeepExistingSessionAsync().then( () =>  {
            if(isMounted){
                setLoading(false);
            }
        })
 
        return () => {
            isMounted = false;
        }
    }, []);
    const LoadingComponent = loadingComponent;
    return (
        <>
            {loading ? (
               <LoadingComponent/>
            ) : (
                <>{children}</>
            )}
        </>
    );
}


export const OidcProvider : FC<PropsWithChildren<OidcProviderProps>>  = ({ children, 
                                                                             configuration, 
                                                                             configurationName = "default", 
                                                                             callbackSuccessComponent = Callback, 
                                                                             callbackErrorComponent = AuthenticateError,
                                                                             authenticatingComponent = Authenticating,
                                                                             loadingComponent = Loading,
                                                                             serviceWorkerNotSupportedComponent = ServiceWorkerNotSupported,
                                                                             authenticatingErrorComponent = AuthenticatingError,
sessionLostComponent=SessionLost }) => {
    const getOidc =(configurationName="default") => {
        return Oidc.getOrCreate(configuration, configurationName);
    }
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(defaultEventState);
    const [subscriptionId, setSubscriptionId] = useState(null);
    const [currentConfigurationName, setConfigurationName] = useState("default");

    useEffect(() => {
        let isMounted = true;
        const oidc = getOidc(configurationName);
        if(subscriptionId){
            oidc.removeEventSubscription(subscriptionId);
        }
        const newSubscriptionId = oidc.subscriveEvents((name, data) => {
            if (!isMounted) {
                return;
            }
            if (name == Oidc.eventNames.loginAsync_begin
                || name == Oidc.eventNames.loginCallbackAsync_end
                || name == Oidc.eventNames.loginAsync_error
                || name == Oidc.eventNames.loginCallbackAsync_error
                || name == Oidc.eventNames.refreshTokensAsync_error
            ) {
                setEvent({name, data});
            } else if (name == Oidc.eventNames.service_worker_not_supported_by_browser && configuration.service_worker_only === true) {
                setEvent({name, data});
            }
        });
        
            if(isMounted) {
                setConfigurationName(configurationName);
                setSubscriptionId(newSubscriptionId);
                setLoading(false);
            }
        return () => {
            isMounted = false;
        }
    }, [configuration, configurationName]);
    
    
    const SessionLostComponent = sessionLostComponent;
    const AuthenticatingComponent = authenticatingComponent;
    const LoadingComponent = loadingComponent;
    const ServiceWorkerNotSupportedComponent = serviceWorkerNotSupportedComponent;
    const AuthenticatingErrorComponent = authenticatingErrorComponent;

    switch(event.name){
        case Oidc.eventNames.service_worker_not_supported_by_browser:
            return <ServiceWorkerNotSupportedComponent />;
        case Oidc.eventNames.loginAsync_begin:
            return <AuthenticatingComponent />;
        case Oidc.eventNames.loginAsync_error:
        case Oidc.eventNames.loginCallbackAsync_error:
            return <AuthenticatingErrorComponent />;
        case Oidc.eventNames.refreshTokensAsync_error:
            return <SessionLostComponent />;
        default:
            // @ts-ignore
            return (
                <>
                    {(loading || (currentConfigurationName != configurationName )) ? (
                        <LoadingComponent/>
                    ) : (
                            <>
                                  <OidcRoutes redirect_uri={configuration.redirect_uri} 
                                              callbackSuccessComponent={callbackSuccessComponent} 
                                              callbackErrorComponent={callbackErrorComponent}
                                              configurationName={configurationName}
                                                >
                                      <OidcSession loadingComponent={LoadingComponent} configurationName={configurationName}>
                                        {children}
                                      </OidcSession>
                                </OidcRoutes>
                            </> 
                    )}
                </>
            );
    }
};

export default OidcProvider;
