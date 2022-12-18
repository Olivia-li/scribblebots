export const codexPrompt = 
`   const q1HumanLifts = \`Can humans hold \${prompt} in their hand? Answer with yes or no. Explain\`
    const q2PCutsDownTree = \`Is a \${prompt} a sharp enough to cut wood? Answer with yes or no. Explain\`
    const q3PStartsFire = \`Can a \${prompt} be used to start a fire directly? Answer with yes or no. Explain\`
    const q4CatLikes = \`Do cats like \${prompt}? Answer with yes or no. Explain\`
    const q5ClimbDown = \`Can a living thing use a \${prompt} to climb down a tree? Answer with yes or no. Explain\`
    const q6UsedToFly = \`Can \${prompt} be used to go in the air? Answer with yes or no. Explain\`
    const q7FlyDangerous = \`Is flying with a \${prompt} dangerous? Answer with yes or no. Explain\`
    const q8LivingCreature = \`Assume \${prompt} is real. Is \${prompt} by itself a living creature? Answer with yes or no. Explain\`
    const q9CausesHarmToCat = \`Could a \${prompt} will cause harm to a cat if locked in a room together? Answer with yes or no. Explain\`
    const q10SavesCatsFromTrees = \`Can a \${prompt} save a cat from a tree? Answer with yes or no. Explain\`

    const gptRes1HumanLifts = await askGpt(q1HumanLifts)
    console.log("gptRes1HumanLifts: ", gptRes1HumanLifts)
    const gptRes1HumanLiftsBool = await isGPTResYes(gptRes1HumanLifts)
    console.log("gptRes1HumanLiftsBool: ", gptRes1HumanLiftsBool)

    const gptRes2PCutsDownTree = await askGpt(q2PCutsDownTree)
    console.log("gptRes2PCutsDownTree: ", gptRes2PCutsDownTree)
    const gptRes2PCutsDownTreeBool = await isGPTResYes(gptRes2PCutsDownTree)
    console.log("gptRes2PCutsDownTreeBool: ", gptRes2PCutsDownTreeBool)

    // The image can be held by a human
    if (gptRes1HumanLiftsBool) {
      handleSetImagePosition("human")
    }

    // The image can be held by a human and can cut down a tree
    if (gptRes1HumanLiftsBool && gptRes2PCutsDownTreeBool) {
      // start animation
      setTreeState("cut_down")
      setGamePlayExplanation(gptRes2PCutsDownTree)
      return EndCase.TreeCutDown
      // end animation
    }

    const gptRes3PStartsFire = await askGpt(q3PStartsFire)
    console.log("gptRes3PStartsFire: ", gptRes3PStartsFire)
    const gptRes3PStartsFireBool = await isGPTResYes(gptRes3PStartsFire)
    console.log("gptRes3PStartsFire Bool: ", gptRes3PStartsFireBool)


    // The image can start a fire
    if (gptRes3PStartsFireBool) {
      // start animation
      if (!gptRes1HumanLiftsBool) {
        setFireDownState(3)
        handleSetImagePosition("tree")
      }
      setCatState("fire")
      setTreeState("fire")
      setGamePlayExplanation(gptRes3PStartsFire)
      return EndCase.TreeTakesFire
      // end animation
    }

    const gptRes4CatLikes = await askGpt(q4CatLikes)
    console.log("gptRes4CatLikes : ", gptRes4CatLikes)
    const gptRes4CatLikesBool = await isGPTResYes(gptRes4CatLikes)
    console.log("gptRes4CatLikes Bool: ", gptRes4CatLikesBool)


    // The image is liked by cats
    if (gptRes4CatLikesBool) {
      // start animation
      if (!gptRes1HumanLiftsBool) {
        setCatState("climb_down")
        handleSetImagePosition("tree")
      } else {
        setCatState("attraction")
      }
      setGamePlayExplanation(gptRes4CatLikes)
      return EndCase.CatGoesDown
      // end animation
    }

    const gptRes5ClimbDown = await askGpt(q5ClimbDown)
    console.log("gptRes5ClimbDown : ", gptRes5ClimbDown)
    const gptRes5ClimbDownBool = await isGPTResYes(gptRes5ClimbDown)
    console.log("gptRes4CatLikes Bool: ", gptRes5ClimbDownBool)


    // The image can be used to climb down the tree
    if (gptRes5ClimbDownBool) {
      // start animation
      setCatState("climb_down")
      handleSetImagePosition("tree")
      setGamePlayExplanation(gptRes5ClimbDown)
      return EndCase.CatGoesDown
      // end animation
    }

    const gptRes6UsedToFly = await askGpt(q6UsedToFly)
    console.log("gptRes6UsedToFly : ", gptRes6UsedToFly)
    const gptRes6UsedToFlyBool = await isGPTResYes(gptRes6UsedToFly)
    console.log("gptRes6UsedToFly Bool: ", gptRes6UsedToFlyBool)

    const gptRes7FlyDangerous = await askGpt(q7FlyDangerous)
    console.log("gptRes7FlyDangerous : ", gptRes7FlyDangerous)
    const gptRes7FlyDangerousBool = await isGPTResYes(gptRes7FlyDangerous)
    console.log("gptRes7FlyDangerous Bool: ", gptRes7FlyDangerousBool)


    // The image can be used to fly and it is dangerous
    if (gptRes6UsedToFlyBool && gptRes7FlyDangerousBool) {
      // start animation
      setCatState("fly_up")
      handleSetImagePosition("cat")
      setGamePlayExplanation(gptRes7FlyDangerous)
      return EndCase.CatFliesUp
      // end animation
    }
    // The image can be used to fly but it is not dangerous
    if (gptRes6UsedToFlyBool && !gptRes7FlyDangerousBool) {
      // start animation
      setCatState("climb_down")
      handleSetImagePosition("cat")
      setGamePlayExplanation(gptRes6UsedToFly)
      return EndCase.CatFliesDown
      // end animation
    }

    const gptRes8LivingCreature = await askGpt(q8LivingCreature)
    console.log("gptRes8LivingCreature : ", gptRes8LivingCreature)
    const gptRes8LivingCreatureBool = await isGPTResYes(gptRes8LivingCreature)
    console.log("gptRes8LivingCreature Bool: ", gptRes8LivingCreatureBool)

    const gptRes9CausesHarmToCat = await askGpt(q9CausesHarmToCat)
    console.log("gptRes9CausesHarmToCat : ", gptRes9CausesHarmToCat)
    const gptRes9CausesHarmToCatBool = await isGPTResYes(gptRes9CausesHarmToCat)
    console.log("gptRes9CausesHarmToCat Bool: ", gptRes9CausesHarmToCatBool)

    // The image is a living creature and it causes harm to a cat
    if (gptRes8LivingCreatureBool & gptRes9CausesHarmToCatBool) {
      // start animation
      handleSetImagePosition("tree")
      setCatState("dead")
      setGamePlayExplanation(gptRes9CausesHarmToCat)
      return EndCase.CatGoesToHeaven
      // end animation
    }

    const gptRes10SavesCatsFromTrees = await askGpt(q10SavesCatsFromTrees)
    console.log("gptRes10SavesCatsFromTrees : ", gptRes10SavesCatsFromTrees)
    const gptRes10SavesCatsFromTreesBool = await isGPTResYes(gptRes10SavesCatsFromTrees)
    console.log("gptRes10SavesCatsFromTreesBool: ", gptRes10SavesCatsFromTreesBool)

    // The image is a living creature and it can save a cat from the tree 
    if (gptRes8LivingCreatureBool & gptRes10SavesCatsFromTreesBool) {
      // start animation
      handleSetImagePosition("tree")
      setCatState("climb_down")
      setGamePlayExplanation(gptRes10SavesCatsFromTrees)
      return EndCase.CatGoesDown
      // end animation
    }
    
    // The image can be used to fly and can cut down a tree
    if (gptRes6UsedToFlyBool && gptRes2PCutsDownTreeBool) {
      // start animation
      setCatState("fly_up")
      setTreeState("cut_down")
      setGamePlayExplanation(gptRes2PCutsDownTree)
      return EndCase.TreeCutDown
      // end animation
    }
    
`