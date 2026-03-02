/*
 * GlobeLayers Gem -- Unit Tests
 *
 * Tests the layer registry service: registration, unregistration,
 * visibility toggling, and notification bus.
 */

#include <AzTest/AzTest.h>
#include <AzCore/UnitTest/TestTypes.h>
#include <GlobeLayers/GlobeLayersBus.h>
#include <GlobeLayers/GlobeLayerNotificationBus.h>
#include <AzCore/std/string/string.h>

// Since we test the system component directly, include it
#include "Clients/GlobeLayersSystemComponent.h"

// ---- Testable subclass exposing protected lifecycle methods ----
class TestableGlobeLayersSystemComponent : public GlobeLayers::GlobeLayersSystemComponent
{
public:
    using GlobeLayers::GlobeLayersSystemComponent::Activate;
    using GlobeLayers::GlobeLayersSystemComponent::Deactivate;
    using GlobeLayers::GlobeLayersSystemComponent::RegisterLayer;
    using GlobeLayers::GlobeLayersSystemComponent::UnregisterLayer;
    using GlobeLayers::GlobeLayersSystemComponent::SetVisible;
    using GlobeLayers::GlobeLayersSystemComponent::IsVisible;
    using GlobeLayers::GlobeLayersSystemComponent::GetLayerNames;
};

// ---- Helper: notification listener ----
class LayerNotificationListener : public GlobeLayers::GlobeLayerNotificationBus::Handler
{
public:
    void Connect() { GlobeLayers::GlobeLayerNotificationBus::Handler::BusConnect(); }
    void Disconnect() { GlobeLayers::GlobeLayerNotificationBus::Handler::BusDisconnect(); }

    void OnLayerRegistered(const AZStd::string& name) override { m_registered.push_back(name); }
    void OnLayerUnregistered(const AZStd::string& name) override { m_unregistered.push_back(name); }
    void OnVisibilityChanged(const AZStd::string& name, bool visible) override
    {
        m_visibilityChanges.push_back({name, visible});
    }

    AZStd::vector<AZStd::string> m_registered;
    AZStd::vector<AZStd::string> m_unregistered;
    AZStd::vector<AZStd::pair<AZStd::string, bool>> m_visibilityChanges;
};

// ---- Tests ----

TEST(GlobeLayers, RegisterAndQuery)
{
    TestableGlobeLayersSystemComponent component;
    component.Activate();

    EXPECT_TRUE(component.RegisterLayer("Population"));
    EXPECT_TRUE(component.RegisterLayer("Earthquakes"));
    EXPECT_FALSE(component.RegisterLayer("Population")); // duplicate

    auto names = component.GetLayerNames();
    EXPECT_EQ(names.size(), 2u);

    component.Deactivate();
}

TEST(GlobeLayers, DefaultVisibility)
{
    TestableGlobeLayersSystemComponent component;
    component.Activate();

    component.RegisterLayer("Population");
    EXPECT_TRUE(component.IsVisible("Population")); // visible by default

    component.Deactivate();
}

TEST(GlobeLayers, ToggleVisibility)
{
    TestableGlobeLayersSystemComponent component;
    component.Activate();

    component.RegisterLayer("Earthquakes");
    EXPECT_TRUE(component.IsVisible("Earthquakes"));

    component.SetVisible("Earthquakes", false);
    EXPECT_FALSE(component.IsVisible("Earthquakes"));

    component.SetVisible("Earthquakes", true);
    EXPECT_TRUE(component.IsVisible("Earthquakes"));

    component.Deactivate();
}

TEST(GlobeLayers, UnregisterLayer)
{
    TestableGlobeLayersSystemComponent component;
    component.Activate();

    component.RegisterLayer("Buildings");
    EXPECT_TRUE(component.IsVisible("Buildings"));

    component.UnregisterLayer("Buildings");
    EXPECT_FALSE(component.IsVisible("Buildings")); // gone

    auto names = component.GetLayerNames();
    EXPECT_EQ(names.size(), 0u);

    component.Deactivate();
}

TEST(GlobeLayers, UnregisterNonexistent)
{
    TestableGlobeLayersSystemComponent component;
    component.Activate();

    // Should not crash
    component.UnregisterLayer("DoesNotExist");
    EXPECT_EQ(component.GetLayerNames().size(), 0u);

    component.Deactivate();
}

TEST(GlobeLayers, IsVisibleNonexistent)
{
    TestableGlobeLayersSystemComponent component;
    component.Activate();

    EXPECT_FALSE(component.IsVisible("DoesNotExist"));

    component.Deactivate();
}

AZ_UNIT_TEST_HOOK(DEFAULT_UNIT_TEST_ENV);
