Feature: Action panel

  Scenario: Panel shows setup message before game starts
    Given I access the game page
    Then the action panel should contain "Configuración de partida"

  Scenario: Panel shows current player turn during a round
    Given I access the game page
    When I set player 0 name to Ana
    And I set player 1 name to Bob
    And I remove extra players until only 2 remain
    And I click the Start game button
    Then the action panel should contain "Turno de"

  Scenario: Panel shows round completed after round ends
    Given I access the game page
    When I set player 0 name to Ana
    And I set player 1 name to Bob
    And I remove extra players until only 2 remain
    And I click the Start game button
    And I force the round to end by staying
    Then the action panel should contain "Ronda completada"
    And I should see the Start next round button