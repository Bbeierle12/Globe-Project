use iced::widget::{column, container, row, scrollable, text, text_input, Column};
use iced::{Element, Length};

use crate::app::Message;
use crate::cesium::ion_api::{IonAsset, IonStatus};
use crate::data::types::Country;
use crate::utils::format::format_population;
use crate::utils::search::{filter_countries, sort_by_population};
use crate::ui::details::{country_detail, subdivision_detail, DetailView};

/// Build the sidebar as an Iced Element.
pub fn sidebar_view<'a>(
    countries: &'a [Country],
    search_query: &'a str,
    selected_index: Option<usize>,
    selected_subdivision: Option<(usize, usize)>,
    expanded: &'a std::collections::HashSet<usize>,
    auto_rotate: bool,
    ion_status: &IonStatus,
    ion_assets: &[IonAsset],
) -> Element<'a, Message> {
    let search_bar = text_input("Search countries...", search_query)
        .on_input(Message::SearchChanged)
        .padding(8)
        .size(14);

    let rotate_label = if auto_rotate { "Rotating" } else { "Paused" };
    let rotate_toggle = iced::widget::button(text(rotate_label).size(12))
        .on_press(Message::ToggleRotation)
        .padding(4);

    let header = row![search_bar, rotate_toggle]
        .spacing(8)
        .padding(8);

    let mut filtered = filter_countries(countries, search_query);
    sort_by_population(countries, &mut filtered);

    let mut list_items: Vec<Element<'a, Message>> = Vec::new();

    for &idx in &filtered {
        let country = &countries[idx];
        let is_expanded = expanded.contains(&idx);

        let pop_str = format_population(country.population);
        let label = text(format!("{} ({})", country.name, pop_str)).size(13);
        let entry = iced::widget::button(label)
            .on_press(Message::SelectCountry(idx))
            .width(Length::Fill)
            .padding(4);

        list_items.push(entry.into());

        // Show subdivisions if expanded
        if is_expanded {
            for (si, sub) in country.subdivisions.iter().enumerate() {
                let sub_pop = format_population(sub.population);
                let sub_label = text(format!("  {} ({})", sub.name, sub_pop)).size(12);
                let sub_entry = iced::widget::button(sub_label)
                    .on_press(Message::SelectSubdivision(idx, si))
                    .width(Length::Fill)
                    .padding(2);

                list_items.push(sub_entry.into());
            }
        }
    }

    let list = Column::with_children(list_items).spacing(2);
    let scrollable_list = scrollable(list).height(Length::Fill);

    // Details panel: show subdivision when selected, else country.
    let details: Element<'a, Message> = match (selected_subdivision, selected_index) {
        (Some((ci, si)), _) if ci < countries.len() && si < countries[ci].subdivisions.len() => {
            detail_panel(subdivision_detail(&countries[ci].subdivisions[si]))
        }
        (_, Some(ci)) if ci < countries.len() => {
            detail_panel(country_detail(&countries[ci]))
        }
        _ => text("Select a country").size(12).into(),
    };

    let ion = ion_panel(ion_status, ion_assets);

    let content = column![header, scrollable_list, details, ion]
        .spacing(4)
        .width(Length::Fixed(320.0))
        .height(Length::Fill);

    container(content).into()
}

/// Cesium Ion status + asset list panel.
fn ion_panel(status: &IonStatus, assets: &[IonAsset]) -> Element<'static, Message> {
    let header_str = match status {
        IonStatus::Loading        => "Cesium Ion  ·  Connecting…".into(),
        IonStatus::Connected(u)   => format!("Cesium Ion  ·  ✓ {u}"),
        IonStatus::Error(e)       => format!("Cesium Ion  ·  ✗ {e}"),
        IonStatus::NoToken        => "Cesium Ion  ·  No token".into(),
    };

    let mut rows: Vec<Element<'static, Message>> = vec![
        text(header_str).size(11).into(),
    ];

    for a in assets.iter().take(25) {
        let bytes_str = match a.bytes {
            Some(b) if b > 0 => format!(" · {}", format_bytes(b)),
            _                => String::new(),
        };
        rows.push(
            text(format!("  {} · {}{}", a.name, a.asset_type, bytes_str))
                .size(10)
                .into(),
        );
    }
    if assets.len() > 25 {
        rows.push(text(format!("  … and {} more", assets.len() - 25)).size(10).into());
    }

    Column::with_children(rows)
        .spacing(2)
        .padding([6, 8])
        .into()
}

fn format_bytes(b: u64) -> String {
    if b >= 1_000_000_000 { format!("{:.1} GB", b as f64 / 1e9) }
    else if b >= 1_000_000 { format!("{:.1} MB", b as f64 / 1e6) }
    else if b >= 1_000     { format!("{:.1} KB", b as f64 / 1e3) }
    else                   { format!("{b} B") }
}

/// Render a detail view panel. Takes ownership of DetailView to avoid lifetime issues.
fn detail_panel(detail: DetailView) -> Element<'static, Message> {
    let mut items: Vec<Element<'static, Message>> = vec![
        text(detail.name).size(16).into(),
        text(format!("Population: {}", detail.population)).size(12).into(),
    ];

    if let Some(density) = detail.density {
        items.push(text(format!("Density: {density}")).size(12).into());
    }
    if let Some(region) = detail.region {
        items.push(text(format!("Region: {region}")).size(12).into());
    }
    if let Some(capital) = detail.capital {
        items.push(text(format!("Capital: {capital}")).size(12).into());
    }
    if let Some(area) = detail.area {
        items.push(text(format!("Area: {area}")).size(12).into());
    }
    if let Some(change) = detail.change {
        items.push(text(format!("Change: {change}")).size(12).into());
    }
    if let Some(age) = detail.median_age {
        items.push(text(format!("Median age: {age}")).size(12).into());
    }
    if let Some(count) = detail.subdivision_count {
        items.push(text(format!("Subdivisions: {count}")).size(12).into());
    }

    Column::with_children(items)
        .spacing(4)
        .padding(8)
        .into()
}
