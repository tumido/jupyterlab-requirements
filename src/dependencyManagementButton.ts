/**
 * Jupyterlab requirements.
 *
 * Jupyterlab extension for managing dependencies.
 *
 * @link   https://github.com/thoth-station/jupyterlab-requirements#readme
 * @file   Jupyterlab extension for managing dependencies.
 * @author Francesco Murdaca <fmurdaca@redhat.com>
 * @since  0.0.1
 */
import { ToolbarButton } from '@jupyterlab/apputils';
import React from 'react';
import { ReactWidget, Dialog } from '@jupyterlab/apputils';
import { MessageLoop } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';
import { DependenciesManagementUI } from './components/dependencyManagementUI';
import { THOTH_TOOLBAR_BUTTON_POSITION } from './constants';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import { IDisposable } from '@lumino/disposable';
import { get_requirements, get_requirement_lock, get_thoth_configuration, } from "./notebook";
/**
 * Manage dependencies button extension
 *  - Attach button to notebook toolbar and launch a dialog to handle dependencies
 */
export class ManageDependenciesButtonExtension
    implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
    private panel: NotebookPanel;

    openWidget = async (): Promise<void> => {
        const metadata = this.panel.content.model.toString();
        console.log('metadata', metadata);

        // Check if any requirements are stored in notebook metadata
        const initial_requirements = await get_requirements(this.panel);
        console.log("requirements", initial_requirements);

        // Check if any requirements locked are stored in notebook metadata
        const initial_requirements_lock = await get_requirement_lock(this.panel);
        console.log("requirements_lock", initial_requirements_lock);

        // Check if any thoth config is stored in notebook metadata
        const initial_config_file = get_thoth_configuration(this.panel);
        console.log('Thoth config from notebook metadata', initial_config_file);
        /**
         * Start UI for dependency Management
         */
        const widget = ReactWidget.create(
            React.createElement(DependenciesManagementUI,
                {
                    panel: this.panel,
                    initial_requirements: initial_requirements,
                    initial_requirements_lock: initial_requirements_lock,
                    initial_config_file: initial_config_file
                })
            );
        MessageLoop.sendMessage(widget, Widget.Msg.UpdateRequest);
        const ui = {
            title: 'Manage Dependencies',
            body: widget,
            buttons: [Dialog.cancelButton()]
        };
        const dialog = new Dialog(ui);
        dialog.launch();
        // Save all changes to disk.
        this.panel.context.save();
    };

    createNew(
        panel: NotebookPanel,
        context: DocumentRegistry.IContext<INotebookModel>
      ): IDisposable {
        this.panel = panel;
        // Create the toolbar button
        const manageDependenciesButton = new ToolbarButton({
            label: 'Manage Dependencies ...',
            onClick: this.openWidget,
            tooltip: 'Manage Dependencies ...'
        });
        // Add the toolbar button to the notebook
        panel.toolbar.insertItem(THOTH_TOOLBAR_BUTTON_POSITION, 'dependencyManagement', manageDependenciesButton);
        // The ToolbarButton class implements `IDisposable`, so the
        // button *is* the extension for the purposes of this method.
        return manageDependenciesButton;
    }
}