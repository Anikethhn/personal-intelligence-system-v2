package com.personalintelligence.system.service;

import com.personalintelligence.system.entity.Subscription;
import com.personalintelligence.system.entity.User;
import com.personalintelligence.system.repository.SubscriptionRepository;
import com.personalintelligence.system.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    public SubscriptionService(
            SubscriptionRepository subscriptionRepository,
            UserRepository userRepository) {

        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
    }


    public Subscription createSubscription(
            Subscription subscription,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        subscription.setId(null);
        subscription.setUser(user);
        subscription.setActive(true);

        return subscriptionRepository.save(subscription);
    }



    public List<Subscription> getMySubscriptions(
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return subscriptionRepository.findByUser(user);
    }



    public List<Subscription> getActiveSubscriptions(
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return subscriptionRepository.findByUserAndActive(
                user,
                true
        );
    }



    public List<Subscription> getInactiveSubscriptions(
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return subscriptionRepository.findByUserAndActive(
                user,
                false
        );
    }


    public Subscription getSubscriptionById(
            Long subscriptionId,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return subscriptionRepository
                .findByIdAndUser(subscriptionId, user)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Subscription not found"
                        ));
    }


    public Subscription updateSubscription(
            Long subscriptionId,
            Subscription updatedSubscription,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Subscription existingSubscription =
                subscriptionRepository
                        .findByIdAndUser(
                                subscriptionId,
                                user
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Subscription not found"
                                ));


        existingSubscription.setName(
                updatedSubscription.getName()
        );

        existingSubscription.setAmount(
                updatedSubscription.getAmount()
        );

        existingSubscription.setBillingCycle(
                updatedSubscription.getBillingCycle()
        );

        existingSubscription.setNextBillingDate(
                updatedSubscription.getNextBillingDate()
        );

        existingSubscription.setCategory(
                updatedSubscription.getCategory()
        );

        existingSubscription.setDescription(
                updatedSubscription.getDescription()
        );


        return subscriptionRepository.save(
                existingSubscription
        );
    }




    public Subscription toggleSubscription(
            Long subscriptionId,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Subscription subscription =
                subscriptionRepository
                        .findByIdAndUser(
                                subscriptionId,
                                user
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Subscription not found"
                                ));


        subscription.setActive(
                !subscription.isActive()
        );


        return subscriptionRepository.save(
                subscription
        );
    }



    public void deleteSubscription(
            Long subscriptionId,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Subscription subscription =
                subscriptionRepository
                        .findByIdAndUser(
                                subscriptionId,
                                user
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Subscription not found"
                                ));


        subscriptionRepository.delete(
                subscription
        );
    }

    public List<Subscription> getSubscriptionsByCategory(
            String category,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return subscriptionRepository
                .findByUserAndCategory(
                        user,
                        category
                );
    }
}