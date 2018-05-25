import React, { Component } from 'react';
import { StyleSheet, View, Picker, FlatList } from 'react-native';
import { Button, Divider, Text } from 'react-native-elements'
import AuthService from "../components/AuthService";
import axios from 'axios';
import { StackNavigator } from 'react-navigation';
import FavourList from '../components/FavourList.js';
import FavourMessageInput from '../components/FavourMessageInput.js';

// Required props:
// - requestableFavours: An array of favours the target of the trade has
// - recipientfirstName: First name of trade recipient
// - recipientlastName: Last name of trade recipient
// - recipientId: _id of the trade recipient

export default class HomeScreen extends Component {
    constructor() {
        super();
        this.state = {
            recipientId: '',
            recipientFirstName: '',
            recipientFirstName: '',
            requestableFavours: [],
            currentStep: 1,
            creator: {},
            offerableFavours: [],
            requestedFavours: (new Map()),
            offeredFavours: (new Map()),
            tradeMessage: '',
            failedAttempt: false,
        };
        this.authService = new AuthService();
        this.setOfferedFavours = this.setOfferedFavours.bind(this);
        this.setRequestedFavours = this.setRequestedFavours.bind(this);
    }

    componentDidMount() {
        this.mounted = true;
        this.getCreator();
        this.getRecipient();
        this.fetchOfferableFavours();
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    async getCreator() {
        if (this.authService.loggedIn() && this.mounted) {
            const profile = await this.authService.getProfile();
            this.setState({
                creator: profile,
            });
        }
    }

    getRecipient() {
        const { recipientId,
            recipientFirstName,
            recipientLastName,
            requestableFavours,
        } = this.props.navigation.state.params;

        this.setState({
            recipientId,
            recipientFirstName,
            recipientLastName,
            requestableFavours,
        });
    }

    fetchOfferableFavours() {
        this.authService.getToken()
            .then(token => {
                const config = {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': token,
                    },
                };

                axios.get('http://favour-trader-test.appspot.com/api/users/profile/', config)
                    .then(res => res.data)
                    .then(profileInfo => {
                        if (this.mounted) {
                            this.setState({ offerableFavours: profileInfo.user.has });
                        }
                    })
            })
    }

    setRequestedFavours(favours) {
        this.setState({
            currentStep: 3,
            requestedFavours: favours,
        });
    }

    setOfferedFavours(favours) {
        this.setState({
            currentStep: 2,
            offeredFavours: favours,
        });
    }

    setTradeMessage = (tradeMessage) => {
        this.setState({
            tradeMessage,
        });
    }

    filterSelectedOffered(favourMap) {
        // Filter out 'false' (deselected) skills
        let selected = [];
        const selectedValues = Array.from(favourMap.entries()).filter(keyValue => (
            keyValue[1] === true
        ));

        selectedValues.forEach(trueValue => {
            this.state.offerableFavours.forEach(offerable => {
                if (offerable._id === trueValue[0]._id) {
                    selected.push({
                        skillId: trueValue[0]._id,
                        description: '',
                    });
                }
            }
            )
        })

        return selected;
    }

    filterSelectedRequested(favourMap) {
        // Filter out 'false' (deselected) skills
        let selected = [];
        const selectedValues = Array.from(favourMap.entries()).filter(keyValue => (
            keyValue[1] === true
        ));

        selectedValues.forEach(trueValue => {
            this.state.requestableFavours.forEach(requestable => {
                if (requestable._id === trueValue[0]._id) {
                    selected.push({
                        skillId: trueValue[0]._id,
                        description: '',
                    })
                }
            }
            )
        })

        return selected;
    }
    submitTrade = () => {
        // Note: In order to allow navigating forward / backwards while saving
        // user selections, offered/request Maps are key/value pairs of
        // Skill_id/selected(boolean). Only send favours for which the value is
        // true (selected).
        this.authService.getToken()
            .then(token => {
                const { authService,
                    recipientFirstName,
                    recipientLastName,
                    recipientId,
                    creator,
                    requestedFavours,
                    offeredFavours,
                    tradeMessage
                } = this.state;

                const filteredOfferedSkills = this.filterSelectedOffered(offeredFavours);
                const filteredRequestedSkills = this.filterSelectedRequested(requestedFavours);

                const url = 'http://favour-trader.appspot.com/api/contracts/';
                const body = {
                    offeror: {
                        id: creator.id,
                        favours: filteredOfferedSkills,
                        name: {
                            first: creator.name.first,
                            last: creator.name.last,
                        },
                    },
                    offeree: {
                        id: recipientId,
                        favours: filteredRequestedSkills,
                        name: {
                            first: recipientFirstName,
                            last: recipientLastName,
                        },
                    },
                    messages: [tradeMessage],
                };
                const headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': token,
                };

                axios.post(url, body, { headers })
                    .then(res => {
                        if (res.status !== '200') {
                            this.props.navigation.navigate('MatchProfile', { profileID: recipientId });
                        } else {
                            this.setState({
                                failedAttempt: true,
                            });
                        }
                    });
            })
    }

    renderCurrentStep() {
        const { navigate } = this.props.navigation;

        const { authService,
            tradeTarget,
            recipientFirstName,
            recipientLastName,
            recipientId,
            requestedFavours,
            requestableFavours,
            offeredFavours,
            offerableFavours,
            tradeMessage,
        } = this.state;

        switch (this.state.currentStep) {
            case 1:
            default:
                return (
                    <FavourList
                        title={`What will you do for ${recipientFirstName}?`}
                        data={offerableFavours}
                        onCancel={() => navigate('Home')}
                        onSubmit={this.setOfferedFavours}
                        initialSelected={offeredFavours}
                    />
                );
            case 2:
                return (
                    <FavourList
                        title={`What would you like ${recipientFirstName} to do for you?`}
                        data={requestableFavours}
                        onSubmit={this.setRequestedFavours}
                        onCancel={() => this.setState({
                            currentStep: 1,
                        })}
                        initialSelected={requestedFavours}
                    />
                );
            case 3:
                return (
                    <FavourMessageInput
                        title={`Add a message for ${recipientFirstName} (optional)?`}
                        onChangeText={this.setTradeMessage}
                        message={tradeMessage || ''}
                        onSubmit={this.submitTrade}
                        onCancel={() => this.setState({
                            currentStep: 2,
                        })}
                    />
                );
        }
    }

    render() {
        const  {recipientFirstName } = this.props.navigation.state.params;
        return (
            <View>
                <Text h3>Trade With {recipientFirstName}</Text>
                <Divider style={styles.divider} />
                {this.renderCurrentStep()}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    picker: {
        width: 400,
    },
    divider: {
        width: '100%',
        backgroundColor: 'grey'
    }
});
